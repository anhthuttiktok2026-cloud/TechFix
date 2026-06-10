const DB_NAME = "TechFixDB";
const DB_VERSION = 1;
const STORE_NAME = "errors";

let db;

function initDB() {

return new Promise((resolve, reject) => {

const request =
indexedDB.open(
DB_NAME,
DB_VERSION
);

request.onerror = () =>
reject(request.error);

request.onsuccess = () => {

db = request.result;

resolve();

};

request.onupgradeneeded = event => {

db = event.target.result;

if (
!db.objectStoreNames.contains(
STORE_NAME
)
) {

db.createObjectStore(
STORE_NAME,
{
keyPath: "id"
}
);

}

};

});

}

function saveError(error){

return new Promise(
(resolve,reject)=>{

const tx =
db.transaction(
STORE_NAME,
"readwrite"
);

tx.objectStore(
STORE_NAME
).put(error);

tx.oncomplete =
()=>resolve();

tx.onerror =
()=>reject();

});

}

function getAllErrors(){

return new Promise(
(resolve,reject)=>{

const tx =
db.transaction(
STORE_NAME,
"readonly"
);

const request =
tx.objectStore(
STORE_NAME
).getAll();

request.onsuccess =
()=>resolve(
request.result
);

request.onerror =
()=>reject();

});

}

function deleteErrorDB(id){

return new Promise(
(resolve,reject)=>{

const tx =
db.transaction(
STORE_NAME,
"readwrite"
);

tx.objectStore(
STORE_NAME
).delete(id);

tx.oncomplete =
()=>resolve();

tx.onerror =
()=>reject();

});

}

