;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; This Source Code Form is "Incompatible With Secondary Licenses", as
;; defined by the Mozilla Public License, v. 2.0.
;;
;; Copyright (c) 2020 UXBOX Labs SL

(ns app.main.ui.workspace.viewport
  (:require
   [clojure.set :as set]
   [cuerdas.core :as str]
   [beicon.core :as rx]
   [goog.events :as events]
   [potok.core :as ptk]
   [rumext.alpha :as mf]
   [promesa.core :as p]
   [app.main.ui.icons :as i]
   [app.main.ui.cursors :as cur]
   [app.main.ui.modal :as modal]
   [app.common.data :as d]
   [app.main.constants :as c]
   [app.main.data.workspace :as dw]
   [app.main.data.workspace.drawing :as dd]
   [app.main.data.colors :as dwc]
   [app.main.data.fetch :as mdf]
   [app.main.refs :as refs]
   [app.main.store :as st]
   [app.main.streams :as ms]
   [app.main.ui.keyboard :as kbd]
   [app.main.ui.hooks :as hooks]
   [app.main.ui.workspace.shapes :refer [shape-wrapper frame-wrapper]]
   [app.main.ui.workspace.shapes.interactions :refer [interactions]]
   [app.main.ui.workspace.drawarea :refer [draw-area]]
   [app.main.ui.workspace.selection :refer [selection-handlers]]
   [app.main.ui.workspace.presence :as presence]
   [app.main.ui.workspace.snap-points :refer [snap-points]]
   [app.main.ui.workspace.snap-distances :refer [snap-distances]]
   [app.main.ui.workspace.frame-grid :refer [frame-grid]]
   [app.main.ui.workspace.shapes.outline :refer [outline]]
   [app.common.math :as mth]
   [app.util.dom :as dom]
   [app.util.dom.dnd :as dnd]
   [app.util.object :as obj]
   [app.main.ui.context :as muc]
   [app.common.geom.shapes :as gsh]
   [app.common.geom.point :as gpt]
   [app.util.perf :as perf]
   [app.common.uuid :as uuid]
   [app.util.timers :as timers])
  (:import goog.events.EventType))

;; --- Coordinates Widget

(mf/defc coordinates
  []
  (let [coords (some-> (hooks/use-rxsub ms/mouse-position)
                       (gpt/round))]
    [:ul.coordinates
     [:span {:alt "x"}
      (str "X: " (:x coords "-"))]
     [:span {:alt "y"}
      (str "Y: " (:y coords "-"))]]))

(mf/defc cursor-tooltip
  [{:keys [zoom tooltip] :as props}]
  (let [coords (some-> (hooks/use-rxsub ms/mouse-position)
                       (gpt/divide (gpt/point zoom zoom)))
        pos-x (- (:x coords) 100)
        pos-y (+ (:y coords) 30)]
    [:g {:transform (str "translate(" pos-x "," pos-y ")")}
     [:foreignObject {:width 200 :height 100 :style {:text-align "center"}}
      [:span tooltip]]]))

;; --- Cursor tooltip

(defn- get-shape-tooltip
  "Return the shape tooltip text"
  [shape]
  (case (:type shape)
    :icon "Click to place the Icon"
    :image "Click to place the Image"
    :rect "Drag to draw a Box"
    :text "Drag to draw a Text Box"
    :path "Click to draw a Path"
    :circle "Drag to draw a Circle"
    nil))

;; --- Selection Rect

(mf/defc selection-rect
  {:wrap [mf/memo]}
  [{:keys [data] :as props}]
  (when data
    [:rect.selection-rect
     {:x (:x data)
      :y (:y data)
      :width (:width data)
      :height (:height data)}]))

;; --- Viewport Positioning

(defn- handle-viewport-positioning
  [viewport-ref]
  (let [node   (mf/ref-val viewport-ref)
        stoper (rx/filter #(= ::finish-positioning %) st/stream)

        stream (->> ms/mouse-position-delta
                    (rx/take-until stoper))]
    (st/emit! dw/start-pan)
    (rx/subscribe stream
                  (fn [delta]
                    (let [vbox (.. ^js node -viewBox -baseVal)
                          zoom (gpt/point @refs/selected-zoom)
                          delta (gpt/divide delta zoom)]
                      (st/emit! (dw/update-viewport-position
                                 {:x #(- % (:x delta))
                                  :y #(- % (:y delta))})))))))

;; --- Viewport

(declare remote-user-cursors)


;; TODO: revisit the refs usage (vs props)
(mf/defc shape-outlines
  {::mf/wrap-props false}
  [props]
  (let [objects   (unchecked-get props "objects")
        selected  (or (unchecked-get props "selected") #{})
        hover     (or (unchecked-get props "hover") #{})
        outline?  (set/union selected hover)
        shapes    (->> (vals objects) (filter (comp outline? :id)))
        transform (mf/deref refs/current-transform)]
    (when (nil? transform)
      [:g.outlines
       (for [shape shapes]
         [:& outline {:key (str "outline-" (:id shape))
                      :shape (gsh/transform-shape shape)}])])))

(mf/defc frames
  {::mf/wrap [mf/memo]
   ::mf/wrap-props false}
  [props]
  (let [data     (mf/deref refs/workspace-page)
        hover    (unchecked-get props "hover")
        selected (unchecked-get props "selected")
        objects  (:objects data)
        root     (get objects uuid/zero)
        shapes   (->> (:shapes root)
                      (map #(get objects %)))]
    [:*
     [:g.shapes
      (for [item shapes]
        (if (= (:type item) :frame)
          [:& frame-wrapper {:shape item
                             :key (:id item)
                             :objects objects}]
          [:& shape-wrapper {:shape item
                             :key (:id item)}]))]

     [:& shape-outlines {:objects objects
                         :selected selected
                         :hover hover}]]))

(defn format-viewbox [vbox]
  (str/join " " [(+ (:x vbox 0) (:left-offset vbox 0))
                 (:y vbox 0)
                 (:width vbox 0)
                 (:height vbox 0)]))

(mf/defc pixel-picker-overlay
  {::mf/wrap-props false}
  [props]
  (let [vport (unchecked-get props "vport")
        vbox (unchecked-get props "vbox")
        viewport-ref (unchecked-get props "viewport-ref")
        options (unchecked-get props "options")
        svg-ref       (mf/use-ref nil)
        canvas-ref    (mf/use-ref nil)
        fetch-pending (mf/deref (mdf/pending-ref))

        on-mouse-move-picker
        (fn [event]
          (when-let [zoom-view-node (.getElementById js/document "picker-detail")]
            (let [{brx :left bry :top} (dom/get-bounding-rect (mf/ref-val viewport-ref))
                  x (- (.-clientX event) brx)
                  y (- (.-clientY event) bry)

                  zoom-context (.getContext zoom-view-node "2d")
                  canvas-node (mf/ref-val canvas-ref)
                  canvas-context (.getContext canvas-node "2d")
                  pixel-data (.getImageData canvas-context x y 1 1)
                  rgba (.-data pixel-data)
                  r (obj/get rgba 0)
                  g (obj/get rgba 1)
                  b (obj/get rgba 2)
                  a (obj/get rgba 3)

                  area-data (.getImageData canvas-context (- x 25) (- y 20) 50 40)]

              (-> (js/createImageBitmap area-data)
                  (p/then (fn [image]
                            ;; Draw area
                            (obj/set! zoom-context "imageSmoothingEnabled" false)
                            (.drawImage zoom-context image 0 0 200 160))))
              (st/emit! (dwc/pick-color [r g b a])))))

        on-mouse-down-picker
        (fn [event]
          (dom/prevent-default event)
          (dom/stop-propagation event)
          (st/emit! (dwc/pick-color-select true (kbd/shift? event))))

        on-mouse-up-picker
        (fn [event]
          (dom/prevent-default event)
          (dom/stop-propagation event)
          (st/emit! (dwc/stop-picker))
          (modal/disallow-click-outside!))]

    (mf/use-effect
     ;; Everytime we finish retrieving a new URL we redraw the canvas
     ;; so even if we're not finished the user can start to pick basic
     ;; shapes
     (mf/deps props fetch-pending)
     (fn []
       (try
         (let [canvas-node (mf/ref-val canvas-ref)
               canvas-context (.getContext canvas-node "2d")
               svg-node (mf/ref-val svg-ref)]
           (timers/schedule
            #(let [xml (.serializeToString (js/XMLSerializer.) svg-node)
                   content (str "data:image/svg+xml;base64," (js/btoa xml))
                   img (js/Image.)]
               (obj/set! img  "onload"
                         (fn []
                           (.drawImage canvas-context img 0 0)))
               (obj/set! img "src" content))))
         (catch :default e (.error js/console e)))))

    [:*
     [:div.overlay
      {:style {:position "absolute"
               :top 0
               :left 0
               :width "100%"
               :height "100%"
               :cursor cur/picker}
       :on-mouse-down on-mouse-down-picker
       :on-mouse-up on-mouse-up-picker
       :on-mouse-move on-mouse-move-picker}]
     [:canvas {:ref canvas-ref
               :width (:width vport 0)
               :height (:height vport 0)
               :style {:display "none"}}]
     [:& (mf/provider muc/embed-ctx) {:value true}
      [:svg.viewport
       {:ref svg-ref
        :preserveAspectRatio "xMidYMid meet"
        :width (:width vport 0)
        :height (:height vport 0)
        :view-box (format-viewbox vbox)
        :style {:display "none"
                :background-color (get options :background "#E8E9EA")}}
       [:& frames]]]]))

(mf/defc viewport
  [{:keys [page-id page local layout] :as props}]
  (let [{:keys [options-mode
                zoom
                flags
                vport
                vbox
                edition
                tooltip
                selected
                panning
                picking-color?]} local

        file          (mf/deref refs/workspace-file)
        viewport-ref  (mf/use-ref nil)
        zoom-view-ref (mf/use-ref nil)
        last-position (mf/use-var nil)
        drawing       (mf/deref refs/workspace-drawing)
        drawing-tool  (:tool drawing)
        drawing-obj   (:object drawing)

        pick-color (mf/use-state [255 255 255 255])

        zoom (or zoom 1)

        on-mouse-down
        (mf/use-callback
         (mf/deps drawing-tool edition)
         (fn [event]
           (dom/stop-propagation event)
           (let [event (.-nativeEvent event)
                 ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)]
             (st/emit! (ms/->MouseEvent :down ctrl? shift? alt?))

             (cond
               (and (not edition) (= 1 (.-which event)))
               (if drawing-tool
                 (st/emit! (dd/start-drawing drawing-tool))
                 (st/emit! dw/handle-selection))

               (and (not edition)
                    (= 2 (.-which event)))
               (handle-viewport-positioning viewport-ref)))))

        on-context-menu
        (mf/use-callback
         (fn [event]
           (dom/prevent-default event)
           (dom/stop-propagation event)
           (let [position (dom/get-client-position event)]
             (st/emit! (dw/show-context-menu {:position position})))))

        on-mouse-up
        (mf/use-callback
         (fn [event]
           (dom/stop-propagation event)
           (let [event (.-nativeEvent event)
                 ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)]
             (st/emit! (ms/->MouseEvent :up ctrl? shift? alt?))

             (when (= 2 (.-which event))
               (st/emit! dw/finish-pan
                         ::finish-positioning)))))

        on-pointer-down
        (mf/use-callback
          (fn [event]
           (let [target (dom/get-target event)]
             ; Capture mouse pointer to detect the movements even if cursor
             ; leaves the viewport or the browser itself
             ; https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
             (.setPointerCapture target (.-pointerId event)))))

        on-pointer-up
        (mf/use-callback
          (fn [event]
           (let [target (dom/get-target event)]
             ; Release pointer on mouse up
             (.releasePointerCapture target (.-pointerId event)))))

        on-click
        (mf/use-callback
         (fn [event]
           (dom/stop-propagation event)
           (let [ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)]
             (st/emit! (ms/->MouseEvent :click ctrl? shift? alt?)))))

        on-double-click
        (mf/use-callback
         (fn [event]
           (dom/stop-propagation event)
           (let [ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)]
             (st/emit! (ms/->MouseEvent :double-click ctrl? shift? alt?)))))

        on-key-down
        (mf/use-callback
         (fn [event]
           (let [bevent (.getBrowserEvent ^js event)
                 key (.-keyCode ^js event)
                 ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)
                 target (dom/get-target event)]

             (when-not (.-repeat bevent)
               (st/emit! (ms/->KeyboardEvent :down key ctrl? shift? alt?))
               (when (and (kbd/space? event)
                          (not= "rich-text" (obj/get target "className")))
                 (handle-viewport-positioning viewport-ref))))))

        on-key-up
        (mf/use-callback
         (fn [event]
           (let [key (.-keyCode event)
                 ctrl? (kbd/ctrl? event)
                 shift? (kbd/shift? event)
                 alt? (kbd/alt? event)]
             (when (kbd/space? event)
               (st/emit! dw/finish-pan ::finish-positioning))
             (st/emit! (ms/->KeyboardEvent :up key ctrl? shift? alt?)))))

        translate-point-to-viewport
        (fn [pt]
          (let [viewport (mf/ref-val viewport-ref)
                vbox  (.. ^js viewport -viewBox -baseVal)
                brect (.getBoundingClientRect viewport)
                brect (gpt/point (d/parse-integer (.-left brect))
                                 (d/parse-integer (.-top brect)))
                box   (gpt/point (.-x vbox)
                                 (.-y vbox))
                ]
            (-> (gpt/subtract pt brect)
                (gpt/divide (gpt/point @refs/selected-zoom))
                (gpt/add box)
                (gpt/round 0))))

        on-mouse-move
        (fn [event]
          (let [event (.getBrowserEvent ^js event)
                pt (dom/get-client-position ^js event)
                pt (translate-point-to-viewport pt)
                delta (gpt/point (.-movementX ^js event)
                                 (.-movementY ^js event))]
            (st/emit! (ms/->PointerEvent :delta delta
                                         (kbd/ctrl? event)
                                         (kbd/shift? event)
                                         (kbd/alt? event)))
            (st/emit! (ms/->PointerEvent :viewport pt
                                         (kbd/ctrl? event)
                                         (kbd/shift? event)
                                         (kbd/alt? event)))))

        on-mouse-wheel
        (mf/use-callback
         (fn [event]
           (let [node (mf/ref-val viewport-ref)
                 target (dom/get-target event)]
             (cond
               (kbd/ctrl? event)
               (let [event (.getBrowserEvent ^js event)
                     pos   @ms/mouse-position]
                 (dom/prevent-default event)
                 (dom/stop-propagation event)
                 (if (pos? (.-deltaY event))
                   (st/emit! (dw/decrease-zoom pos))
                   (st/emit! (dw/increase-zoom pos))))

               (.contains ^js node target)
               (let [event (.getBrowserEvent ^js event)
                     delta (.-deltaY ^js event)
                     delta (/ delta @refs/selected-zoom)]
                 (dom/prevent-default event)
                 (dom/stop-propagation event)
                 (if (kbd/shift? event)
                   (st/emit! (dw/update-viewport-position {:x #(+ % delta)}))
                   (st/emit! (dw/update-viewport-position {:y #(+ % delta)}))))))))

        on-drag-enter
        (fn [e]
          (when (or (dnd/has-type? e "app/shape")
                    (dnd/has-type? e "Files")
                    (dnd/has-type? e "text/uri-list"))
            (dom/prevent-default e)))

        on-drag-over
        (fn [e]
          (when (or (dnd/has-type? e "app/shape")
                    (dnd/has-type? e "Files")
                    (dnd/has-type? e "text/uri-list"))
            (dom/prevent-default e)))

        ;; TODO: seems duplicated callback is the same as one located
        ;; in left_toolbar
        on-uploaded
        (fn [{:keys [id name] :as image}]
          (let [shape {:name name
                       :metadata {:width (:width image)
                                  :height (:height image)
                                  :id (:id image)
                                  :path (:path image)}}
                aspect-ratio (/ (:width image) (:height image))]
            (st/emit! (dw/create-and-add-shape :image shape aspect-ratio))))

        on-drop
        (fn [event]
          (dom/prevent-default event)
          (cond
            (dnd/has-type? event "app/shape")
            (let [shape (dnd/get-data event "app/shape")
                  point (gpt/point (.-clientX event) (.-clientY event))
                  viewport-coord (translate-point-to-viewport point)
                  final-x (- (:x viewport-coord) (/ (:width shape) 2))
                  final-y (- (:y viewport-coord) (/ (:height shape) 2))]
              (st/emit! (dw/add-shape (-> shape
                                          (assoc :x final-x)
                                          (assoc :y final-y)))))

            (dnd/has-type? event "text/uri-list")
            (let [data (dnd/get-data event "text/uri-list")
                  lines (str/lines data)
                  urls (filter #(and (not (str/blank? %))
                                     (not (str/starts-with? % "#")))
                               lines)]
              (->> urls
                   (map (fn [uri]
                          (with-meta {:file-id (:id file)
                                      :local? true
                                      :uri uri}
                            {:on-success on-uploaded})))
                   (map dw/upload-media-objects)
                   (apply st/emit!)))

            :else
            (let [js-files (dnd/get-files event)
                  params   {:file-id (:id file)
                            :local? true
                            :js-files js-files}]
              (st/emit! (dw/upload-media-objects
                         (with-meta params
                           {:on-success on-uploaded}))))))

        on-resize
        (fn [event]
          (let [node (mf/ref-val viewport-ref)
                prnt (dom/get-parent node)]
            (st/emit! (dw/update-viewport-size (dom/get-client-size prnt)))))

        options (mf/deref refs/workspace-page-options)]

    (mf/use-layout-effect
     (fn []
       (let [node (mf/ref-val viewport-ref)
             prnt (dom/get-parent node)

             key1 (events/listen js/document EventType.KEYDOWN on-key-down)
             key2 (events/listen js/document EventType.KEYUP on-key-up)
             key3 (events/listen node EventType.MOUSEMOVE on-mouse-move)
             ;; bind with passive=false to allow the event to be cancelled
             ;; https://stackoverflow.com/a/57582286/3219895
             key4 (events/listen js/window EventType.WHEEL on-mouse-wheel #js {:passive false})
             key5 (events/listen js/window EventType.RESIZE on-resize)]
         (st/emit! (dw/initialize-viewport (dom/get-client-size prnt)))
         (fn []
           (events/unlistenByKey key1)
           (events/unlistenByKey key2)
           (events/unlistenByKey key3)
           (events/unlistenByKey key4)
           (events/unlistenByKey key5)))))

    (mf/use-layout-effect (mf/deps layout) on-resize)

    [:*
     (when picking-color?
       [:& pixel-picker-overlay {:vport vport
                                 :vbox vbox
                                 :viewport-ref viewport-ref
                                 :options options
                                 :layout layout}])

     [:svg.viewport
      {:preserveAspectRatio "xMidYMid meet"
       :width (:width vport 0)
       :height (:height vport 0)
       :view-box (format-viewbox vbox)
       :ref viewport-ref
       :class (when drawing-tool "drawing")
       :style {:cursor (cond
                         panning cur/hand
                         (= drawing-tool :frame) cur/create-artboard
                         (= drawing-tool :rect) cur/create-rectangle
                         (= drawing-tool :circle) cur/create-ellipse
                         (= drawing-tool :path) cur/pen
                         (= drawing-tool :curve)cur/pencil
                         drawing-tool cur/create-shape
                         :else cur/pointer-inner)
               :background-color (get options :background "#E8E9EA")}
       :on-context-menu on-context-menu
       :on-click on-click
       :on-double-click on-double-click
       :on-mouse-down on-mouse-down
       :on-mouse-up on-mouse-up
       :on-pointer-down on-pointer-down
       :on-pointer-up on-pointer-up
       :on-drag-enter on-drag-enter
       :on-drag-over on-drag-over
       :on-drop on-drop}

      [:g
       [:& frames {:key page-id
                   :hover (:hover local)
                   :selected (:selected selected)}]

       (when (seq selected)
         [:& selection-handlers {:selected selected
                                 :zoom zoom
                                 :edition edition}])

       (when drawing-obj
         [:& draw-area {:shape drawing-obj
                        :zoom zoom
                        :modifiers (:modifiers local)}])

       (when (contains? layout :display-grid)
         [:& frame-grid {:zoom zoom}])

       [:& snap-points {:layout layout
                        :transform (:transform local)
                        :drawing drawing-obj
                        :zoom zoom
                        :page-id page-id
                        :selected selected}]

       [:& snap-distances {:layout layout
                           :zoom zoom
                           :transform (:transform local)
                           :selected selected
                           :page-id page-id}]

       (when tooltip
         [:& cursor-tooltip {:zoom zoom :tooltip tooltip}])]

      [:& presence/active-cursors {:page-id page-id}]
      [:& selection-rect {:data (:selrect local)}]
      (when (= options-mode :prototype)
        [:& interactions {:selected selected}])]]))

