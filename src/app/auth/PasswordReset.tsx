import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Hash, Key, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api, HttpError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/layout/Logo";
import { passwordStrength, validatePassword } from "@/lib/validate";
import { cn } from "@/lib/cn";

export default function PasswordResetPage() {
  const [id, setId] = useState("");
  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const strength = passwordStrength(password);

  const reset = useMutation({
    mutationFn: () =>
      api.passwordReset({
        id: Number(id),
        backupSecret: secret,
        newPassword: password,
      }),
    onSuccess: () => setDone(true),
    onError: (e) => {
      if (e instanceof HttpError) {
        if (e.payload.message === "invalid_password") {
          setErrors({ password: "Şifre kurallara uymuyor" });
        } else {
          setErrors({ secret: "Geçersiz kimlik veya gizli kelime" });
        }
      }
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!id) errs.id = "Gerekli";
    if (!secret) errs.secret = "Gerekli";
    const pv = validatePassword(password);
    if (!pv.ok) errs.password = pv.reason ?? "Geçersiz";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    reset.mutate();
  };

  if (done) {
    return (
      <div className="h-full flex items-center justify-center p-6 bg-ink">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <div className="mx-auto mb-6 h-16 w-16 bg-lime-soft flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-lime" />
          </div>
          <h2 className="font-display text-display-lg uppercase text-bone">
            Şifre sıfırlandı
          </h2>
          <p className="mt-3 text-mute">
            Yeni şifrenle giriş yapabilirsin.
          </p>
          <Button
            variant="volt"
            size="lg"
            block
            className="mt-6"
            onClick={() => navigate("/login")}
          >
            Giriş Sayfasına Dön
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6 bg-ink overflow-y-auto">
      <div className="absolute top-6 left-6">
        <Logo />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        onSubmit={onSubmit}
        className="w-full max-w-sm"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-volt mb-3">
          // şifre sıfırla
        </div>
        <h2 className="font-display text-display-xl uppercase tracking-tight text-bone leading-[0.95]">
          Yeni
          <br />
          şifre belirle
        </h2>
        <p className="mt-3 text-sm text-mute">
          Kimliğini ve kayıt sırasında belirlediğin gizli kelimeyi gir.
        </p>

        <div className="mt-8 space-y-4">
          <Input
            label="Kullanıcı ID"
            prefix={<Hash className="h-3.5 w-3.5" />}
            value={id}
            onChange={(e) => setId(e.target.value.replace(/[^\d]/g, ""))}
            error={errors.id}
            inputMode="numeric"
          />
          <Input
            label="Gizli Kelime"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            error={errors.secret}
          />
          <div>
            <Input
              label="Yeni Şifre"
              type="password"
              prefix={<Key className="h-3.5 w-3.5" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              hint="8-31 krk · büyük + küçük + rakam + özel"
            />
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "h-1 flex-1",
                    n <= strength.score
                      ? strength.score < 3
                        ? "bg-scarlet"
                        : strength.score < 5
                        ? "bg-amber"
                        : "bg-lime"
                      : "bg-steel",
                  )}
                />
              ))}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-mute">
              {strength.label}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          variant="volt"
          size="lg"
          block
          loading={reset.isPending}
          className="mt-6"
        >
          Şifreyi Sıfırla
        </Button>

        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute hover:text-volt"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Girişe Dön
        </Link>
      </motion.form>
    </div>
  );
}
