import xlsx from 'xlsx';
import path from 'path';


const exportExcel = (data, workSheetColumnNames, workSheetName, filePath) => {
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ... data
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
}

const exportDataToExcel = (datas, workSheetColumnNames, workSheetName, filePath) => {
    const data = datas.map(data => {
        return [data.id, data.title, data.vote_average];
    });
    exportExcel(data, workSheetColumnNames, workSheetName, filePath);
}

export default exportDataToExcel;
