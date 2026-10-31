export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.6",
      }}
    >
      <h1>PageCast</h1>
      <p>
        AI-assisted, low-bandwidth, offline-first Teletext information publishing and reading
        platform.
      </p>
      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>System Status</h2>
        <p>
          <strong>Environment:</strong> Foundation Initialized (Sprint 0)
        </p>
        <p>
          <strong>Framework:</strong> Next.js 16 (App Router)
        </p>
        <p>
          <strong>Payload Target:</strong> &le; 10 KiB (10,240 bytes) per PagePack
        </p>
      </section>
    </main>
  );
}
