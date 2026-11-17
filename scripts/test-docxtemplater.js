import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const originalBuffer = fs.readFileSync('MẪU BÁO CÁO SAU MOCK TEST.docx');
const zip = new PizZip(originalBuffer);
let docXml = zip.file('word/document.xml').asText();

// 1. Replace Title month
docXml = docXml.replace('BÁO CÁO SAU MOCK TEST THÁNG …', 'BÁO CÁO SAU MOCK TEST THÁNG {reportMonth}');

// 2. Replace Tên lớp: …
// Notice in original XML:
// <w:t xml:space="preserve">Tên lớp</w:t></w:r><w:r ...><w:t xml:space="preserve">: …</w:t>
docXml = docXml.replace(
  '<w:t xml:space="preserve">Tên lớp</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: …</w:t>',
  '<w:t xml:space="preserve">Tên lớp</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: {className}</w:t>'
);

// 3. Replace Giáo viên phụ trách: …
docXml = docXml.replace(
  '<w:t xml:space="preserve">Giáo viên phụ trách</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: …</w:t>',
  '<w:t xml:space="preserve">Giáo viên phụ trách</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: {teacherName}</w:t>'
);

// 4. Replace Kỹ năng phụ trách: ….
docXml = docXml.replace(
  '<w:t xml:space="preserve">Kỹ năng phụ trách</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: ….</w:t>',
  '<w:t xml:space="preserve">Kỹ năng phụ trách</w:t></w:r><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">: {responsibleSkill}</w:t>'
);

// 5. Table rows:
// Find rows 0, 1, 2
const trRegex = /<w:tr>[\s\S]*?<\/w:tr>/g;
const allTrs = [...docXml.matchAll(trRegex)];
console.log('Matches for tr:', allTrs.length);

if (allTrs.length >= 3) {
  const headerTr = allTrs[0][0];
  const row1 = allTrs[1][0];
  const row2 = allTrs[2][0];

  // In row 1, inject tags into the 3 cells:
  // Cell 1: paraId 0000000C -> {#students}{name}
  // Cell 2: paraId 0000000D -> {score}
  // Cell 3: paraId 0000000E -> {comment}{/students}
  
  // Let's create the tagged row preserving all exact styles and cell widths:
  const taggedRow = row1
    .replace(
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000C"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rtl w:val="0"/></w:rPr></w:r></w:p>',
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000C"><w:pPr><w:jc w:val="left"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{#students}{name}</w:t></w:r></w:p>'
    )
    .replace(
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000D"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rtl w:val="0"/></w:rPr></w:r></w:p>',
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000D"><w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{score}</w:t></w:r></w:p>'
    )
    .replace(
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000E"><w:pPr><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000"><w:rPr><w:rtl w:val="0"/></w:rPr></w:r></w:p>',
      '<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000" w14:paraId="0000000E"><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{comment}{/students}</w:t></w:r></w:p>'
    );

  // Replace row1 and row2 with taggedRow
  docXml = docXml.replace(row1 + row2, taggedRow);
}

// 6. Section 2 content paragraph:
// Replace paraId 00000016
const para16Regex = /<w:p [^>]*?paraId="00000016"[\s\S]*?<\/w:p>/;
const sec2Para = '<w:p w14:paraId="00000016"><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{section2Content}</w:t></w:r></w:p>';
docXml = docXml.replace(para16Regex, sec2Para);

// Remove extra empty paragraphs 17, 18, 19, 1A
docXml = docXml.replace(/<w:p [^>]*?paraId="00000017"[\s\S]*?<\/w:p>/, '');
docXml = docXml.replace(/<w:p [^>]*?paraId="00000018"[\s\S]*?<\/w:p>/, '');
docXml = docXml.replace(/<w:p [^>]*?paraId="00000019"[\s\S]*?<\/w:p>/, '');
docXml = docXml.replace(/<w:p [^>]*?paraId="0000001A"[\s\S]*?<\/w:p>/, '');

// 7. Section 3 content paragraph:
// Replace paraId 0000001C
const para1CRegex = /<w:p [^>]*?paraId="0000001C"[\s\S]*?<\/w:p>/;
const sec3Para = '<w:p w14:paraId="0000001C"><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{section3Content}</w:t></w:r></w:p>';
docXml = docXml.replace(para1CRegex, sec3Para);

zip.file('word/document.xml', docXml);
const preparedTemplate = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/official_template_prepared.docx', preparedTemplate);
console.log('Saved prepared template to public/official_template_prepared.docx');

// Now let's test rendering with Docxtemplater!
const testZip = new PizZip(preparedTemplate);
const doc = new Docxtemplater(testZip, {
  paragraphLoop: true,
  linebreaks: true,
});

doc.render({
  reportMonth: '11/2026',
  className: 'KIDS-05',
  teacherName: 'Nguyễn Thị Lan',
  responsibleSkill: 'Listening & Speaking',
  students: [
    {
      name: 'Trần Minh Anh',
      score: '7.5',
      comment: 'Con tiếp thu bài nhanh, phát âm chuẩn và tích cực tham gia các hoạt động nghe nói trên lớp.'
    },
    {
      name: 'Lê Hoàng Nam',
      score: '5.0',
      comment: 'Con còn rụt rè khi phát biểu, cần tăng cường luyện tập thêm từ vựng và bài tập về nhà.'
    },
    {
      name: 'Phạm Quỳnh Chi',
      score: '8.5',
      comment: 'Con học rất chăm chỉ, thái độ hợp tác tốt, phản xạ nghe hiểu xuất sắc.'
    }
  ],
  section2Content: 'Giáo viên đã trao đổi trực tiếp với từng bạn trên lớp, đồng thời liên hệ phụ huynh của bạn Nam để cùng theo sát việc hoàn thành bài tập về nhà.',
  section3Content: 'Đề xuất trung tâm tiếp tục duy trì hoạt động tương tác nhóm nhỏ, và bổ sung tài liệu luyện nghe thêm cho học viên.'
});

const outputBuffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync('test_output.docx', outputBuffer);
console.log('Successfully generated test_output.docx with 3 student rows!');
