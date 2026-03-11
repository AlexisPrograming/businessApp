export function ModalOverlay({ onClose, children, center = false }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,26,14,0.65)",
        zIndex: 200,
        display: "flex",
        alignItems: center ? "center" : "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-slide"
        style={{
          background: "#FAF7F2",
          borderRadius: center ? 20 : "20px 20px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "28px 24px 44px",
          boxShadow: "0 -8px 60px rgba(44,26,14,0.25)",
        }}
      >
        {!center && (
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "#E8D5B7",
              margin: "0 auto 24px",
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
}
