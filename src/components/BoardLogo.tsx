const BoardLogo = ({ size = 32 }: { size?: number }) => {
  const half = size / 2;
  return (
    <div
      className="grid grid-cols-2 rounded-sm overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div className="bg-primary" style={{ width: half, height: half }} />
      <div className="bg-muted" style={{ width: half, height: half }} />
      <div className="bg-muted" style={{ width: half, height: half }} />
      <div className="bg-primary" style={{ width: half, height: half }} />
    </div>
  );
};

export default BoardLogo;
