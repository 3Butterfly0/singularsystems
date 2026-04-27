import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";
import { Check } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const ImageRenderer = (props) => {
  const { value, data, context } = props;
  const isSelected = context.selectedId === data.id;

  return (
    <div
      className={`w-16 h-16 md:w-20 md:h-20 flex-none flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden p-2 transition-transform ${isSelected ? "ring-2 ring-[#9E00FF]" : ""}`}
    >
      <img
        src={
          value ||
          `https://placehold.co/200x200/F9FAFB/1A1A1A?text=${context.type}`
        }
        alt={data.name}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

const NameRenderer = (props) => {
  const { data } = props;
  const isRecommended = data.is_recommended;

  // extract specs dynamically
  const specs = [];
  if (data.cores) specs.push(`${data.cores} Cores`);
  if (data.threads) specs.push(`${data.threads} Threads`);
  if (data.base_clock) specs.push(`${data.base_clock} Base`);
  if (data.boost_clock) specs.push(`${data.boost_clock} Boost`);
  if (data.capacity) specs.push(data.capacity);
  if (data.speed) specs.push(data.speed);
  if (data.vram) specs.push(`${data.vram} VRAM`);
  if (data.wattage) specs.push(`${data.wattage}W`);
  if (data.form_factor) specs.push(data.form_factor);

  return (
    <div className="flex items-center gap-6 py-4 h-full">
      <div className="w-16 h-16 flex-none bg-gray-50 rounded-xl overflow-hidden p-2">
        <img
          src={
            data.image ||
            `https://placehold.co/200x200/F9FAFB/1A1A1A?text=${data.brand}`
          }
          alt={data.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-black text-[#1A1A1A] truncate">
            {data.name}
          </h3>
          {isRecommended && (
            <span className="bg-[#9E00FF] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0">
              Recommended
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {data.brand}
          </span>
          {specs.length > 0 && <span className="text-gray-200">•</span>}
          <div className="flex items-center gap-2 truncate">
            {specs.map((spec, i) => (
              <React.Fragment key={i}>
                <span className="text-[11px] font-medium text-gray-500">
                  {spec}
                </span>
                {i < specs.length - 1 && (
                  <span className="text-gray-300">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceRenderer = (props) => {
  return (
    <div className="flex items-center justify-end h-full">
      <span className="text-xl font-black text-[#1A1A1A]">
        ₹{props.value?.toLocaleString()}
      </span>
    </div>
  );
};

const ComponentTable = ({ components, selectedId, onSelect, type }) => {
  const colDefs = useMemo(
    () => [
      {
        field: "name",
        headerName: "Component",
        flex: 1,
        cellRenderer: NameRenderer,
        autoHeight: true,
      },
      {
        field: "price",
        headerName: "Price",
        width: 150,
        cellRenderer: PriceRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        },
      },
    ],
    [],
  );

  const onRowClicked = (params) => {
    onSelect(params.data);
  };

  const getRowClass = (params) => {
    return params.data.id === selectedId
      ? "bg-[#9E00FF]/5 ring-2 ring-[#9E00FF] ring-inset rounded-xl"
      : "hover:bg-gray-50";
  };

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
    }),
    [],
  );

  return (
    <div
      className="w-full h-full ag-theme-quartz custom-grid"
      style={{ height: "100%" }}
    >
      <AgGridReact
        rowData={components}
        columnDefs={colDefs}
        onRowClicked={onRowClicked}
        getRowClass={getRowClass}
        rowHeight={90}
        headerHeight={50}
        defaultColDef={defaultColDef}
        context={{ selectedId, onSelect, type }}
        theme={themeQuartz.withParams({
          headerBackgroundColor: "#F8F9FA",
          headerTextColor: "#1A1A1A",
          headerFontSize: "12px",
          headerFontWeight: "800",
          wrapperBorderRadius: "16px",
          rowBorderColor: "#f3f4f6",
        })}
        domLayout="normal"
        suppressCellFocus={true}
      />
    </div>
  );
};

export default ComponentTable;
