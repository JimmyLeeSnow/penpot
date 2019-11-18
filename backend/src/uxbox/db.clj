;; This Source Code Form is subject to the terms of the Mozilla Public
;; License, v. 2.0. If a copy of the MPL was not distributed with this
;; file, You can obtain one at http://mozilla.org/MPL/2.0/.
;;
;; Copyright (c) 2019 Andrey Antukh <niwi@niwi.nz>

(ns uxbox.db
  (:require
   [clojure.tools.logging :as log]
   [lambdaisland.uri :refer [uri]]
   [mount.core :as mount :refer [defstate]]
   [promesa.core :as p]
   [uxbox.config :as cfg]
   [uxbox.core :refer [system]]
   [uxbox.util.data :as data]
   [uxbox.util.pgsql :as pg]
   [vertx.core :as vx])
  (:import io.vertx.core.buffer.Buffer))

(defn- create-pool
  [config system]
  (let [dburi (:database-uri config)
        username (:database-username config)
        password (:database-password config)
        dburi (-> (uri dburi)
                  (assoc :user username)
                  (assoc :password password)
                  (str))]
    (log/info "creating connection pool with" dburi)
    (pg/tl-pool dburi {:system system})))

(defstate pool
  :start (create-pool cfg/config system))

(defmacro with-atomic
  [& args]
  `(pg/with-atomic ~@args))

(def row-xfm
  (comp (map pg/row->map)
        (map data/normalize-attrs)))

(defmacro query
  [& args]
  `(pg/query ~@args {:xfm row-xfm}))

(defmacro query-one
  [& args]
  `(pg/query-one ~@args {:xfm row-xfm}))
