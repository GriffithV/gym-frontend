import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Hash, Lock, ArrowRight } from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/layout/Logo";
import { toast } from "@/components/ui/Toast";

export default function LoginPage() {
  const [id, setId] = useState("1");
  const [password, setPassword] = useState("password123ytu");
  const [errors, setErrors] = useState<{ id?: string; password?: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, isHydrated } = useAuth();

  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  useEffect(() => {
    if (isHydrated && user) navigate(from, { replace: true });
  }, [isHydrated, user, from, navigate]);

  const login = useMutation({
    mutationFn: async () => {
      await api.login({ id: Number(id), password });
      const me = await api.me();
      return me;
    },
    onSuccess: (me) => {
      setUser(me);
      toast({ tone: "success", title: "Hoş geldin", message: `${me.name} ${me.surName}` });
      navigate(from, { replace: true });
    },
    onError: (e) => {
      if (e instanceof HttpError) {
        setErrors({ id: " ", password: "Geçersiz kimlik veya şifre" });
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!id) return setErrors({ id: "Kullanıcı ID gerekli" });
    if (!password) return setErrors({ password: "Şifre gerekli" });
    login.mutate();
  };

  return (
    <div className="h-full grid lg:grid-cols-[1.1fr_1fr] bg-ink overflow-hidden">
      {/* Left brand panel */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-ink via-ink to-carbon"
      >
        <div className="absolute inset-0 bg-grid-faint opacity-50" />
        <div className="absolute -top-1/3 -right-1/4 w-[700px] h-[700px] bg-volt/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-noise opacity-30" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-volt mb-6">
            // operatör paneli — v1.0
          </div>
          <h1 className="font-display text-hero leading-[0.85] uppercase tracking-tight text-bone">
            Salonu
            <br />
            <span className="relative">
              kontrol
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-volt" />
            </span>
            <br />
            altına al.
          </h1>
          <p className="mt-8 max-w-md text-mute leading-relaxed">
            Üyeler, abonelikler, sağlık raporları, ekipman bakımı ve mali
            performans — tek bir merkezden, anlık veriyle.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-px bg-rule">
          {[
            { k: "1.247", l: "Aktif Üye" },
            { k: "12", l: "Makine" },
            { k: "98%", l: "Uptime" },
          ].map((s, i) => (
            <div key={i} className="bg-ink p-4">
              <div className="font-display text-display-sm tabular text-volt">
                {s.k}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Right form panel */}
      <main className="relative flex items-center justify-center p-6 sm:p-12 bg-ink overflow-y-auto">
        <div className="absolute top-6 right-6 lg:hidden">
          <Logo />
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          onSubmit={onSubmit}
          className="w-full max-w-sm"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-volt mb-3">
            // giriş
          </div>
          <h2 className="font-display text-display-xl uppercase tracking-tight text-bone leading-[0.95]">
            Operatör
            <br />
            kimliği
          </h2>
          <p className="mt-3 text-sm text-mute">
            Personel kimliğini ve şifreni kullanarak panele eriş.
          </p>

          <div className="mt-8 space-y-4">
            <Input
              label="Kullanıcı ID"
              prefix={<Hash className="h-3.5 w-3.5" />}
              value={id}
              onChange={(e) => setId(e.target.value.replace(/[^\d]/g, ""))}
              error={errors.id?.trim()}
              inputMode="numeric"
              autoComplete="username"
            />
            <Input
              label="Şifre"
              type="password"
              prefix={<Lock className="h-3.5 w-3.5" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            variant="volt"
            size="lg"
            block
            loading={login.isPending}
            className="mt-6"
          >
            Giriş Yap
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="mt-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest">
            <Link
              to="/password-reset"
              className="text-mute hover:text-volt transition-colors"
            >
              // şifremi unuttum
            </Link>
            <span className="text-rule">v1.0</span>
          </div>

          <div className="mt-10 pt-6 border-t border-rule">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute mb-2">
              // demo erişimi
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              {[
                { id: 1, role: "ADMIN" },
                { id: 3, role: "CLERK" },
                { id: 5, role: "REPAIRMAN" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setId(String(d.id));
                    setPassword(d.id === 1 ? "password123ytu" : "Demo123!");
                  }}
                  className="px-2 py-2 bg-carbon shadow-edge hover:shadow-edge-volt text-mute hover:text-volt transition-all"
                >
                  <div className="text-bone tabular">#{d.id}</div>
                  <div className="text-[9px] mt-0.5">{d.role}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
