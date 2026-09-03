
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver"

// /**
//  * @param data 
//  * @param fileName 
//  */
// export const exportToExcel = (data: any[], fileName: string) => {
//   // Create a new workbook and a worksheet from JSON data
//   const worksheet = XLSX.utils.json_to_sheet(data);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

//   // Convert to binary and save
//   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//   const blob = new Blob([excelBuffer], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   });

//   saveAs(blob, `${fileName}.xlsx`);
// };
