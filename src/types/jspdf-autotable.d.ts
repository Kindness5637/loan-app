declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

declare module "jspdf-autotable" {
  interface UserOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    foot?: (string | number)[][];
    startY?: number;
    margin?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    pageBreak?: "always" | "avoid" | "auto";
    rowPageBreak?: "always" | "avoid" | "auto";
    tableWidth?: "auto" | "wrap" | number;
    showHead?: "everyPage" | "firstPage" | "never";
    showFoot?: "everyPage" | "lastPage" | "never";
    useCss?: boolean;
    theme?: "striped" | "grid" | "plain";
    styles?: {
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | string;
      textColor?: number | number[] | string;
      cellWidth?: "auto" | "wrap" | number;
      minCellWidth?: number;
      minCellHeight?: number;
      cellPadding?: number;
      lineColor?: number | number[] | string;
      lineWidth?: number;
      valign?: "top" | "middle" | "bottom";
      halign?: "left" | "center" | "right";
    };
    headStyles?: {
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | string;
      textColor?: number | number[] | string;
      cellWidth?: "auto" | "wrap" | number;
      minCellWidth?: number;
      minCellHeight?: number;
      cellPadding?: number;
      lineColor?: number | number[] | string;
      lineWidth?: number;
      valign?: "top" | "middle" | "bottom";
      halign?: "left" | "center" | "right";
    };
    bodyStyles?: {
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | string;
      textColor?: number | number[] | string;
      cellWidth?: "auto" | "wrap" | number;
      minCellWidth?: number;
      minCellHeight?: number;
      cellPadding?: number;
      lineColor?: number | number[] | string;
      lineWidth?: number;
      valign?: "top" | "middle" | "bottom";
      halign?: "left" | "center" | "right";
    };
    footStyles?: {
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | string;
      textColor?: number | number[] | string;
      cellWidth?: "auto" | "wrap" | number;
      minCellWidth?: number;
      minCellHeight?: number;
      cellPadding?: number;
      lineColor?: number | number[] | string;
      lineWidth?: number;
      valign?: "top" | "middle" | "bottom";
      halign?: "left" | "center" | "right";
    };
    alternateRowStyles?: {
      fontSize?: number;
      font?: string;
      fontStyle?: string;
      overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
      fillColor?: number | number[] | string;
      textColor?: number | number[] | string;
      cellWidth?: "auto" | "wrap" | number;
      minCellWidth?: number;
      minCellHeight?: number;
      cellPadding?: number;
      lineColor?: number | number[] | string;
      lineWidth?: number;
      valign?: "top" | "middle" | "bottom";
      halign?: "left" | "center" | "right";
    };
    columnStyles?: {
      [key: number]: {
        fontSize?: number;
        font?: string;
        fontStyle?: string;
        overflow?: "linebreak" | "ellipsize" | "visible" | "hidden";
        fillColor?: number | number[] | string;
        textColor?: number | number[] | string;
        cellWidth?: "auto" | "wrap" | number;
        minCellWidth?: number;
        minCellHeight?: number;
        cellPadding?: number;
        lineColor?: number | number[] | string;
        lineWidth?: number;
        valign?: "top" | "middle" | "bottom";
        halign?: "left" | "center" | "right";
      };
    };
    didParseCell?: (data: {
      cell: {
        raw: string | number;
        text: string;
        styles: Record<string, unknown>;
      };
      row: {
        index: number;
        raw: (string | number)[];
        cells: Record<string, unknown>[];
      };
      column: {
        index: number;
        dataKey: string | number;
      };
      section: "head" | "body" | "foot";
    }) => void;
    didDrawCell?: (data: {
      cell: Record<string, unknown>;
      row: Record<string, unknown>;
      column: Record<string, unknown>;
      section: "head" | "body" | "foot";
    }) => void;
    didDrawPage?: (data: {
      pageNumber: number;
      pageCount: number;
      settings: Record<string, unknown>;
      table: Record<string, unknown>;
    }) => void;
  }

  function autoTable(doc: import("jspdf").jsPDF, options: UserOptions): void;
  export default autoTable;
}
