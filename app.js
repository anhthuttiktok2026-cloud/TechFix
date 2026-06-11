console.log("TechFix V12");

let errors = [];
let editingId = null;
let currentImages = [];

function normalizeOCR(text){

return (text || "")
.toUpperCase()
.replace(/\s+/g,"")
.replace(/O/g,"0")
.replace(/[^A-Z0-9]/g,"");
}

function fuzzyScore(a, b){

a = normalizeOCR(a);
b = normalizeOCR(b);

if(!a || !b) return 0;

let i = 0, j = 0, score = 0;

while(i < a.length && j < b.length){

if(a[i] === b[j]){
score += 2;
i++; j++;
}else{
score -= 1;
if(a.length > b.length) i++;
else j++;
}

}

return Math.max(score, 0);
}

function semanticScore(text, query){

text = normalizeOCR(text);
query = normalizeOCR(query);

if(!text || !query) return 0;

let score = 0;

// 1. exact match
if(text === query) return 100;

// 2. substring match
if(text.includes(query)) score += 60;

// 3. character match
let t1 = text.split("");
let t2 = query.split("");

let match = 0;

for(let q of t2){
if(t1.includes(q)) match++;
}

score += (match / Math.max(t2.length,1)) * 30;

// 4. fuzzy (nhẹ)
score += Math.min(10, fuzzyScore(text, query));

// clamp
return Math.min(100, score);
}

function similarity(a, b){

a = normalizeOCR(a);
b = normalizeOCR(b);

if(!a || !b) return 0;

let match = 0;

let map = new Map();

for(let char of a){
map.set(char, (map.get(char) || 0) + 1);
}

for(let char of b){
if(map.get(char) > 0){
match++;
map.set(char, map.get(char) - 1);
}
}

return match;
}


document
.getElementById("image")
.addEventListener(
"change",
function(event){

const files =
event.target.files;

currentImages = [];

for(const file of files){

const reader =
new FileReader();

reader.onload =
function(e){

currentImages.push(
e.target.result
);

};

reader.readAsDataURL(file);

}

});
async function saveData(){

for(const error of errors){

await saveError(error);

}

localStorage.setItem(
"techfix",
JSON.stringify(errors)
);

}

function addError(){

    const code =
document.getElementById(
"code"
).value.trim();

if(!code){

alert(
"Vui lòng nhập mã lỗi"
);

return;

}

const error = {

id:
editingId || Date.now(),

category:
document.getElementById("category").value,

code:
document.getElementById("code").value.trim(),

title:
document.getElementById("title").value,

symptoms:
document.getElementById("symptoms").value,

causes:
document.getElementById("causes").value,

solutions:
document.getElementById("solutions").value,

notes:
document.getElementById(
"notes"
).value,

images:
currentImages

};

if(editingId){

errors =
errors.map(e =>
e.id === editingId
? error
: e
);

editingId = null;

}
else{

errors.push(error);

}

saveData();

renderErrors();

clearForm();

}

function clearForm(){

document.getElementById(
"code"
).value="";

document.getElementById(
"title"
).value="";

document.getElementById(
"symptoms"
).value="";

document.getElementById(
"causes"
).value="";

document.getElementById(
"solutions"
).value="";

document.getElementById(
"notes"
).value="";

document.getElementById(
"image"
).value = "";

currentImages = [];

}


function getCategoryColor(category){

switch(category){

case "Windows":
return "#2196f3";

case "Network":
return "#4caf50";

case "Office":
return "#ff9800";

case "Printer":
return "#9c27b0";

case "Server":
return "#f44336";

default:
return "#607d8b";

}

}
function renderErrors(
list=errors
){

let html="";

list.forEach(item=>{

html+=`

<div class="card">

<h3>${item.code}</h3>

<p>

<span
style="
background:${getCategoryColor(item.category)};
color:white;
padding:5px 10px;
border-radius:20px;
">

${item.category}

</span>

</p>

<p>
<b>Tên:</b>
${item.title}
</p>

<p>
<b>Triệu chứng:</b>
${item.symptoms}
</p>

<p>
<b>Nguyên nhân:</b>
${item.causes}
</p>

<p>
<b>Cách sửa:</b>
${item.solutions}
</p>

<p>
<b>Ghi chú:</b>
${item.notes}
</p>

${
item.images
?
item.images.map(img => `
<img
src="${img}"
style="
max-width:300px;
display:block;
margin-top:10px;
">
`).join("")
:
""
}

<button
class="edit-btn"
onclick="editError(${item.id})">
✏ Chỉnh sửa
</button>

<button
class="delete-btn"
onclick="deleteError(${item.id})">
🗑 Xóa
</button>

</div>

`;

});

document.getElementById(
"counter"
).innerHTML =

`
📚 Tổng lỗi:
<b>${errors.length}</b>

| Hiển thị:
<b>${list.length}</b>
`;
document.getElementById(
"errorsList"
).innerHTML = html;

}

async function deleteError(id){

if(
!confirm("Xóa lỗi này?")
)
return;

await deleteErrorDB(id);

errors =
errors.filter(
e => e.id !== id
);

renderErrors();

}

function editError(id){

const item =
errors.find(
e => e.id === id
);

editingId = id;

document.getElementById(
"category"
).value = item.category;

document.getElementById(
"code"
).value = item.code;

document.getElementById(
"title"
).value = item.title;

document.getElementById(
"symptoms"
).value = item.symptoms;

document.getElementById(
"causes"
).value = item.causes;

document.getElementById(
"solutions"
).value = item.solutions;

document.getElementById(
"notes"
).value = item.notes;

window.scrollTo(
0,
0
);

currentImages =
item.images || [];

}

function openError(id){

let e = errors.find(x => x.id === id);

alert(`
MÃ: ${e.code}
TÊN: ${e.title}
NGUYÊN NHÂN: ${e.causes}
CÁCH SỬA: ${e.solutions}
`);

}

function renderSearchResult(ranked){

let html = "";

ranked.forEach(r => {

if(!r.item) return;

let e = r.item;

html += `
<div class="card">

<h3>${e.code}</h3>

<p>⭐ Score: ${r.score}</p>

<p><b>${e.title}</b></p>

<p>${e.causes}</p>

<button onclick="openError(${e.id})">
📌 Xem chi tiết
</button>

</div>
`;

});

document.getElementById("errorsList").innerHTML = html;

}

function searchErrors(){

let keyword = normalizeOCR(
document.getElementById("searchInput").value
);

let ranked = errors
.map(e => ({
item: e,
score: semanticScore(
e.code + " " + e.title + " " + e.causes + " " + e.solutions,
keyword
)
}))
.sort((a,b) => b.score - a.score)
.slice(0, 3);

if(!ranked.length){
document.getElementById("errorsList").innerHTML =
"❌ Không tìm thấy kết quả";
return;
}

renderSearchResult(ranked);
}

renderErrors();

function backupData(){

const data =
JSON.stringify(
errors,
null,
2
);

const blob =
new Blob(
[data],
{
type:"application/json"
}
);

const a =
document.createElement(
"a"
);

a.href =
URL.createObjectURL(blob);

a.download =
"techfix-backup.json";

a.click();

}

function restoreData(event){

const file =
event.target.files[0];

if(!file) return;

const reader =
new FileReader();

reader.onload =
function(e){

errors =
JSON.parse(
e.target.result
);

saveData();

renderErrors();

alert(
"Khôi phục thành công"
);

};

reader.readAsText(file);

}

if(
"serviceWorker"
in navigator
){

window.addEventListener(
"load",
() => {

navigator
.serviceWorker
.register(
"./service-worker.js"
)
.then(() => {

console.log(
"TechFix PWA Ready"
);

});

}
);

}

initDB()
.then(async ()=>{

errors = await getAllErrors();

renderErrors();

});

async function runOCR(){

const file =
document.getElementById("ocrImage").files[0];

if(!file){

alert("Chọn ảnh trước");

return;

}

document.getElementById(
"ocrResult"
).innerHTML =
"⏳ Đang nhận diện...";

try{

const result =
await Tesseract.recognize(
file,
"eng",
{
    tessedit_char_whitelist:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-_. "
}
);

const text =
result.data.text;

searchOCR(text);

}catch(err){

console.error(err);

document.getElementById(
"ocrResult"
).innerHTML =
"❌ Lỗi OCR";

}

}

function searchOCR(text){

const lower = normalizeOCR(text);

const ranked = errors
.map(e => ({
item: e,
score: semanticScore(
e.code + " " + e.title + " " + e.causes + " " + e.solutions,
lower
)
}))
.sort((a,b) => b.score - a.score)
.slice(0, 3);

document.getElementById("ocrResult").innerHTML = `
<h3>📄 OCR TEXT</h3>
<pre>${text}</pre>
<hr>
<h3>🔥 GỢI Ý TOP MATCH</h3>
`;

if(ranked.length){

ranked.forEach(r => {

let e = r.item;

document.getElementById("ocrResult").innerHTML += `
<div>
<p><b>${e.code}</b> (score: ${r.score})</p>
<p>${e.title}</p>
</div>
`;

});

}else{

document.getElementById("ocrResult").innerHTML += `
<hr>❌ Không tìm thấy lỗi phù hợp
`;

}
}