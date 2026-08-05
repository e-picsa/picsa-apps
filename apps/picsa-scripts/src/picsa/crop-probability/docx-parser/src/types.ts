// Example word xml tags at: http://officeopenxml.com/WPtableCell.php
interface IWordXMLJSONTableRow {
  /** row-level properties */
  'w:trPr': {
    'w:trHeight': '';
  };
  /** table cell entry */
  'w:tc': {
    /** cell-level properties (span and merge styles) */
    'w:tcPr': {
      'w:tcW': '';
      'w:gridSpan': '';
      'w:vMerge': '';
    };
    /** block-level paragraph content */
    'w:p': {
      // styles
      'w:pPr': any;
      'w:r': {
        // row styles
        'w:rPr': any;
        // text content
        'w:t': string;
      }[];
    };
  }[];
}

export interface IWordXMLJSON {
  'w:document': {
    'w:body': {
      // main table node
      'w:tbl': {
        /** Table meta */
        'w:tblGrid': {
          /** Total number of columns (as placeholder cells) */
          'w:gridCol': ['', '', '', '', '', '', '', '', ''];
        };
        /** Table row content */
        'w:tr': IWordXMLJSONTableRow[];
      };
      // additional paragraph node (below table content)
      'w:p': {};
    };
  };
}
