import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Listing, ListingType } from '../types';

interface MapVisualizerProps {
  listings: Listing[];
  onSelect: (id: string) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-xs">
        <p className="font-bold">{data.title}</p>
        <p className="text-gray-500">{data.distanceMiles} miles away</p>
      </div>
    );
  }
  return null;
};

export const MapVisualizer: React.FC<MapVisualizerProps> = ({ listings, onSelect }) => {
  const data = listings.map(l => ({
    x: l.location.x,
    y: l.location.y,
    z: 1,
    ...l
  }));

  return (
    <div className="w-full h-[400px] bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden">
      {/* Mock Map Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-slate-600 shadow-sm">
        📍 2 Mile Radius
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="longitude" hide domain={[-100, 100]} />
          <YAxis type="number" dataKey="y" name="latitude" hide domain={[-100, 100]} />
          <ZAxis type="number" range={[100, 100]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Listings" data={data} onClick={(node) => onSelect(node.payload.id)} cursor="pointer">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.type === ListingType.SKILL ? '#4f46e5' : '#10b981'} 
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Scatter>
          {/* User Location Center */}
          <Scatter data={[{ x: 0, y: 0 }]} fill="#f59e0b" shape="star" />
        </ScatterChart>
      </ResponsiveContainer>
      
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 text-[10px] text-gray-500 bg-white/80 p-2 rounded-lg">
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Goods</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-600 mr-2"></span> Skills</div>
        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> You</div>
      </div>
    </div>
  );
};
