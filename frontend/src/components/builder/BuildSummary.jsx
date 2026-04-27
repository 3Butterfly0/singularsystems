import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const DetailsRenderer = (props) => {
  const { data } = props;
  return (
    <div className="flex flex-col justify-center h-full py-2">
      <p className="text-[9px] font-black text-[#9E00FF] uppercase tracking-[0.2em] mb-0.5">{data.category}</p>
      <h5 className="text-[13px] font-bold text-[#1A1A1A] leading-tight truncate">{data.name}</h5>
    </div>
  );
};

const PriceRenderer = (props) => {
  return (
    <div className="flex items-center justify-end h-full">
      <span className="text-[14px] font-bold text-[#1A1A1A]">₹{props.value?.toLocaleString()}</span>
    </div>
  );
};

const BuildSummary = ({ currentBuild, onNext, onBack, onReset, isLastStep }) => {
  const totalPrice = currentBuild?.total_price || 0;
  
  const rowData = useMemo(() => {
    if (!currentBuild) return [];
    
    const parts = [];
    
    const orderedCategories = [
      { key: 'cpu', label: 'CPU', fields: ['intel_cpu', 'amd_cpu'] },
      { key: 'gpu', label: 'GPU', fields: ['gpu'] },
      { key: 'motherboard', label: 'Motherboard', fields: ['intel_motherboard', 'amd_motherboard'] },
      { key: 'ram', label: 'RAM', fields: ['ram'] },
      { key: 'psu', label: 'Power Supply', fields: ['psu'] },
    ];

    orderedCategories.forEach(cat => {
      cat.fields.forEach(field => {
        const part = currentBuild[field];
        if (part) {
          parts.push({
            category: cat.label,
            name: part.name,
            price: part.price
          });
        }
      });
    });

    return parts;
  }, [currentBuild]);

  const colDefs = useMemo(() => [
    { field: 'details', headerName: '', flex: 1, cellRenderer: DetailsRenderer, sortable: false },
    { field: 'price', headerName: '', width: 100, cellRenderer: PriceRenderer, sortable: false, cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end'} }
  ], []);

  const totalSteps = 5;
  const currentStep = rowData.length;

  return (
    <div className="w-full lg:w-[400px] flex-none h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden">
      
      <div className="flex-none p-8 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Live Configuration</h4>
          <h2 className="text-4xl font-black text-[#1A1A1A]">₹{totalPrice.toLocaleString()}</h2>
        </div>
        <button 
          onClick={onReset}
          className="text-[10px] font-black text-[#9E00FF] uppercase tracking-widest hover:underline"
        >
          Start Over
        </button>
      </div>

      <div className="flex-none px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-grow h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#9E00FF] transition-all duration-500 ease-out" 
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-400 tracking-wider">
            {currentStep} / {totalSteps}
          </span>
        </div>
      </div>

      <div className="flex-grow px-4 pb-4 ag-theme-quartz" style={{ width: '100%' }}>
         <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            rowHeight={70}
            headerHeight={0}
            theme={themeQuartz.withParams({
              rowBorderColor: '#f3f4f6',
              wrapperBorderRadius: '0px',
              wrapperBorder: false,
              rowHoverColor: 'transparent',
            })}
            domLayout="normal"
            suppressCellFocus={true}
            suppressRowHoverHighlight={true}
          />
      </div>

      <div className="flex-none p-8 border-t border-gray-50 flex gap-4">
        {onBack && currentStep > 0 && (
          <button 
            onClick={onBack}
            className="flex-none px-6 py-4 bg-gray-100 text-gray-600 rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-gray-200 transition-all"
          >
            Back
          </button>
        )}
        <button 
          onClick={onNext}
          className="flex-grow py-4 bg-[#9E00FF] text-white rounded-lg font-bold text-[13px] uppercase tracking-widest hover:bg-[#8A00E6] transition-all flex items-center justify-center gap-2"
        >
          {isLastStep ? 'Commission Build →' : 'Review Build →'}
        </button>
      </div>
    </div>
  );
};

export default BuildSummary;
