import { motion } from "framer-motion";
import { QrCode, Copy, Download, Code2, MessageCircle, Palette, Eye } from "lucide-react";
import { useState } from "react";

export default function QRWidget() {
  const [tab, setTab] = useState<"qr" | "widget" | "link">("qr");
  const [message, setMessage] = useState("Hi! I'd like to know more about your services.");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [position, setPosition] = useState("bottom-right");
  const [color, setColor] = useState("primary");

  const shareLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  const colorBg: Record<string, string> = {
    primary: "bg-primary",
    indigo: "bg-indigo",
    cyan: "bg-cyan",
    amber: "bg-amber",
    rose: "bg-rose",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">QR Code & Widget</h1>
        <p className="mt-1 text-sm text-muted-foreground">Generate click-to-chat tools for your website and marketing</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 w-fit">
        {[
          { k: "qr", l: "QR Code", icon: QrCode },
          { k: "widget", l: "Chat Widget", icon: MessageCircle },
          { k: "link", l: "Share Link", icon: Code2 },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Config */}
        <div className="rounded-xl glass-card stat-card-glow p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Configuration</h2>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">WhatsApp Number</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pre-filled Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none" />
          </div>

          {tab === "widget" && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {["bottom-right", "bottom-left", "top-right", "top-left"].map(p => (
                    <button key={p} onClick={() => setPosition(p)} className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${position === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Palette className="h-3 w-3" /> Widget Color</label>
                <div className="flex gap-2">
                  {[
                    { k: "primary", c: "bg-primary" },
                    { k: "indigo", c: "bg-indigo" },
                    { k: "cyan", c: "bg-cyan" },
                    { k: "amber", c: "bg-amber" },
                    { k: "rose", c: "bg-rose" },
                  ].map(o => (
                    <button key={o.k} onClick={() => setColor(o.k)} className={`h-8 w-8 rounded-full ${o.c} ring-2 transition-all ${color === o.k ? "ring-foreground scale-110" : "ring-transparent"}`} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-xl glass-card stat-card-glow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Preview</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /> Live</span>
          </div>

          {tab === "qr" && (
            <div className="flex flex-col items-center gap-4 p-6">
              <div className="rounded-2xl bg-white p-6">
                <QRPattern />
              </div>
              <p className="text-xs text-muted-foreground">Scan to start a WhatsApp chat</p>
              <div className="flex gap-2 w-full">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"><Download className="h-3 w-3" /> PNG</button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><Download className="h-3 w-3" /> SVG</button>
              </div>
            </div>
          )}

          {tab === "widget" && (
            <div className="relative h-80 rounded-lg border border-dashed border-border bg-surface-raised overflow-hidden">
              <div className="p-4 text-xs text-muted-foreground">Your website preview...</div>
              <div className={`absolute ${position.includes("bottom") ? "bottom-4" : "top-4"} ${position.includes("right") ? "right-4" : "left-4"}`}>
                <div className={`flex items-center gap-2 rounded-full ${colorBg[color]} px-4 py-3 text-white shadow-lg cursor-pointer hover:scale-105 transition-transform`}>
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold">Chat with us</span>
                </div>
              </div>
            </div>
          )}

          {tab === "link" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">wa.me Link</p>
                <code className="block text-xs font-mono text-foreground break-all">{shareLink}</code>
              </div>
              <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"><Copy className="h-3 w-3" /> Copy Link</button>
              <div className="rounded-lg bg-surface-raised p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Embed HTML</p>
                <code className="block text-xs font-mono text-foreground whitespace-pre-wrap">{`<a href="${shareLink}" target="_blank">
  Chat on WhatsApp
</a>`}</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QRPattern() {
  // Simple procedural QR-like pattern
  const cells = Array.from({ length: 25 * 25 }, (_, i) => {
    const row = Math.floor(i / 25);
    const col = i % 25;
    const isCorner = (row < 7 && col < 7) || (row < 7 && col > 17) || (row > 17 && col < 7);
    const isCornerCenter = (row >= 2 && row <= 4 && col >= 2 && col <= 4) || (row >= 2 && row <= 4 && col >= 20 && col <= 22) || (row >= 20 && row <= 22 && col >= 2 && col <= 4);
    const isCornerBorder = isCorner && !((row >= 1 && row <= 5 && col >= 1 && col <= 5) || (row >= 1 && row <= 5 && col >= 19 && col <= 23) || (row >= 19 && row <= 23 && col >= 1 && col <= 5));
    if (isCornerBorder) return true;
    if (isCornerCenter) return true;
    if (isCorner) return false;
    return (row * 7 + col * 3 + row * col) % 3 === 0;
  });

  return (
    <div className="grid grid-cols-25 gap-0" style={{ gridTemplateColumns: "repeat(25, 1fr)", width: 200 }}>
      {cells.map((on, i) => (
        <div key={i} className={`aspect-square ${on ? "bg-foreground" : "bg-transparent"}`} />
      ))}
    </div>
  );
}