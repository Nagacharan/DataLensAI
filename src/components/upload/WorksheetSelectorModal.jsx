import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { parseWorksheet } from '../../utils/file-parsers/xlsxParser';
import { Table, FileSpreadsheet, Check } from 'lucide-react';

export function WorksheetSelectorModal({ isOpen, onClose, sheetData, onSheetSelected }) {
  const [selected, setSelected] = useState(sheetData?.sheetNames?.[0] || '');

  if (!sheetData) return null;

  const handleConfirm = () => {
    try {
      const parsed = parseWorksheet(sheetData.workbook, selected, sheetData.fileName);
      onSheetSelected(parsed);
      onClose();
    } catch (err) {
      alert(`Error parsing sheet: ${err.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Excel Worksheet" maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This Excel workbook contains multiple worksheets. Please choose which sheet you would like to analyze:
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {sheetData.sheetNames.map((sheetName) => {
            const isChosen = selected === sheetName;
            return (
              <button
                key={sheetName}
                onClick={() => setSelected(sheetName)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  isChosen
                    ? 'border-coral-500 bg-orange-50/80 text-slate-900 shadow-2xs font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className={`w-4 h-4 ${isChosen ? 'text-coral-500' : 'text-slate-400'}`} />
                  <span className="text-sm">{sheetName}</span>
                </div>
                {isChosen && <Check className="w-4 h-4 text-coral-500" />}
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!selected}>
            Load Worksheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
