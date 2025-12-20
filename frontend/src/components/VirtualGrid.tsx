import React, { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';

interface VirtualGridProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  itemWidth: number;
  columnCount?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
  overscanCount?: number;
}

export function VirtualGrid<T>({
  items,
  height,
  itemHeight,
  itemWidth,
  columnCount = 3,
  renderItem,
  className = '',
  gap = 16,
  overscanCount = 5,
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= items.length) {
      return <div style={style} />;
    }

    return (
      <div
        style={{
          ...style,
          paddingLeft: columnIndex === 0 ? 0 : gap / 2,
          paddingRight: columnIndex === columnCount - 1 ? 0 : gap / 2,
          paddingTop: rowIndex === 0 ? 0 : gap / 2,
          paddingBottom: rowIndex === rowCount - 1 ? 0 : gap / 2,
        }}
      >
        {renderItem(items[index], index)}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={itemWidth}
      height={height}
      rowCount={rowCount}
      rowHeight={itemHeight + gap}
      width="100%"
      overscanCount={overscanCount}
      className={className}
    >
      {Cell}
    </Grid>
  );
}

// Responsive wrapper that switches to virtual scrolling for large lists
interface ResponsiveVirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  threshold?: number; // Switch to virtual scrolling when items exceed this
  className?: string;
}

export function ResponsiveVirtualList<T>({
  items,
  renderItem,
  threshold = 50,
  className = '',
}: ResponsiveVirtualListProps<T>) {
  const useVirtualScrolling = items.length > threshold;

  // Calculate responsive column count
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 3;
    const width = window.innerWidth;
    if (width < 640) return 1; // mobile
    if (width < 1024) return 2; // tablet
    return 3; // desktop
  };

  const [columnCount, setColumnCount] = React.useState(getColumnCount());

  React.useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!useVirtualScrolling) {
    // Use regular grid for small lists
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {items.map((item, index) => (
          <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  // Use virtual scrolling for large lists
  const containerHeight = Math.min(600, window.innerHeight * 0.7);
  const itemHeight = 300; // Approximate card height
  const itemWidth = Math.floor((window.innerWidth - 64) / columnCount); // Account for padding

  return (
    <VirtualGrid
      items={items}
      height={containerHeight}
      itemHeight={itemHeight}
      itemWidth={itemWidth}
      columnCount={columnCount}
      renderItem={renderItem}
      className={className}
    />
  );
}
