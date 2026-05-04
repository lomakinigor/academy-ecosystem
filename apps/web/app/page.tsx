export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "var(--brand-primary)",
          marginBottom: "1rem",
        }}
      >
        Академия Развития Человека им. В.Ю. Светлова
      </h1>
      <p style={{ color: "var(--brand-earth)", maxWidth: "640px" }}>
        Интеллектуальная экосистема. Каркас Этапа 0 поднят.
      </p>
      <span
        style={{
          marginTop: "2rem",
          padding: "0.5rem 1rem",
          background: "var(--brand-accent)",
          color: "var(--brand-primary)",
          borderRadius: "9999px",
          fontWeight: 600,
        }}
      >
        🏛️ Foundation Ready
      </span>
    </main>
  );
}
