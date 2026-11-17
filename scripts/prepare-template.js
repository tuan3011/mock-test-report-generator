import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const templateBuffer = fs.readFileSync('MẪU BÁO CÁO SAU MOCK TEST.docx');
const zip = new PizZip(templateBuffer);
let docXml = zip.file('word/document.xml').asText();

console.log('Original document.xml length:', docXml.length);

// Let's inspect parts of docXml
console.log('Contains THÁNG:', docXml.includes('THÁNG …'));
console.log('Contains Tên lớp:', docXml.includes('Tên lớp'));
console.log('Contains Giáo viên phụ trách:', docXml.includes('Giáo viên phụ trách'));
console.log('Contains Kỹ năng phụ trách:', docXml.includes('Kỹ năng phụ trách'));
