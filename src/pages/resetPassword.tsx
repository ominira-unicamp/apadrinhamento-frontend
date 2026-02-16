import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { TextField } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { jwtDecode } from "jwt-decode";

import Logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";
import UserService from "../services/user/UserService";

const authenticatedResetSchema = z.object({
  currentPassword: z.string()
    .min(8, "Senha atual deve ter pelo menos 8 caracteres"),
  newPassword: z.string()
    .min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const tokenResetSchema = z.object({
  newPassword: z.string()
    .min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type AuthenticatedResetForm = z.infer<typeof authenticatedResetSchema>;
type TokenResetForm = z.infer<typeof tokenResetSchema>;

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const authCtx = useAuth();
  const navigate = useNavigate();

  const isTokenMode = useMemo(() => !!token, [token]);
  const isAuthenticated = useMemo(() => !!authCtx.token, [authCtx.token]);

  const isValidToken = useMemo(() => {
    if (!token) return true;
    try {
      // Attempt to decode and verify the token structure
      const decoded = jwtDecode<{ typ: string; jti: string }>(token);
      return decoded?.typ === "password-reset" && !!decoded?.jti;
    } catch {
      return false;
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthenticatedResetForm | TokenResetForm>({
    resolver: zodResolver(isTokenMode ? tokenResetSchema : authenticatedResetSchema),
  });

  useEffect(() => {
    if (token) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  useEffect(() => {
    if (!token && !authCtx.token) {
      toast.error("Você precisa estar autenticado ou ter um link válido");
      setTimeout(() => navigate("/login"), 2000);
    }

    if (token && !isValidToken) {
      toast.error("Link de redefinição inválido ou expirado");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [token, authCtx.token, navigate, isValidToken]);

  const onSubmit = async (data: any) => {
    try {
      if (isTokenMode) {
        await toast.promise(
          UserService.confirmPasswordReset(token!, data.newPassword),
          {
            success: {
              render: () => {
                setTimeout(() => navigate('/login'), 1500);
                return "Senha redefinida com sucesso! Redirecionando para o login...";
              },
            },
            pending: "Redefinindo senha...",
            error: {
              render: ({ data }: any) => {
                const errorMessage = data?.response?.data?.error?.message || "Token inválido ou expirado";
                return errorMessage;
              }
            }
          }
        );
      } else {
        let userId: string;
        try {
          const decoded = jwtDecode<{id: string}>(authCtx.token);
          if (!decoded?.id) {
            throw new Error("Invalid token format");
          }
          userId = decoded.id;
        } catch (error) {
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          navigate("/login");
          return;
        }

        await toast.promise(
          UserService.updatePassword(userId, data.currentPassword, data.newPassword),
          {
            success: {
              render: () => {
                navigate('/dashboard');
                return "Senha atualizada com sucesso!";
              },
            },
            pending: "Atualizando senha...",
            error: {
              render: ({ data }: any) => {
                const errorMessage = data?.response?.data?.error?.message || "Erro ao atualizar senha";
                return errorMessage;
              }
            }
          }
        );
      }
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  const inputStyle = {
    input: { color: "white" },
    label: { color: "white" },
    "& label.Mui-focused": { color: "#a2f4fd" },
    "& .MuiInput-underline:before": { borderBottomColor: "white" },
    "& .MuiInput-underline:after": { borderBottomColor: "#a2f4fd" },
    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
      borderBottomColor: "#a2f4fd",
    },
  };

  if (!token && !isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-zinc-800 flex flex-col items-center p-5 gap-y-6 text-white">
      {!isTokenMode && (
        <div className="w-full flex justify-start">
          <button
            type="button"
            className="bg-blue-900 rounded-lg px-3 text-white font-bold text-xl cursor-pointer ml-2"
            onClick={() => navigate('/dashboard')}
          >
            ← Voltar
          </button>
        </div>
      )}

      <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />

      <h1 className="text-4xl text-center font-extrabold text-cyan-200">
        {isTokenMode ? "Redefinir Senha" : "Alterar Senha"}
      </h1>

      <p className="mt-4 text-xl max-w-3xl text-rose-100 text-center">
        {isTokenMode
          ? "Escolha uma nova senha para sua conta"
          : "Digite sua senha atual e escolha uma nova senha"}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 w-full max-w-lg bg-zinc-700 p-6 rounded-lg flex flex-col gap-10"
      >
        {!isTokenMode && (
          <>
            <TextField
              label="Senha Atual"
              variant="outlined"
              type="password"
              placeholder="Digite sua senha atual"
              sx={inputStyle}
              slotProps={{ inputLabel: { shrink: true } }}
              {...register("currentPassword")}
            />
            {(errors as any).currentPassword && (
              <span className="text-red-400">{(errors as any).currentPassword.message}</span>
            )}
          </>
        )}

        <TextField
          label="Nova Senha"
          variant="outlined"
          type="password"
          placeholder="Mínimo 8 caracteres"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <span className="text-red-400">{errors.newPassword.message}</span>
        )}

        <TextField
          label="Confirmar Nova Senha"
          variant="outlined"
          type="password"
          placeholder="Digite a nova senha novamente"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <span className="text-red-400">{errors.confirmPassword.message}</span>
        )}

        <button
          type="submit"
          className="bg-amber-600 text-white py-2 rounded-lg cursor-pointer hover:bg-amber-700"
        >
          {isTokenMode ? "REDEFINIR SENHA" : "ATUALIZAR SENHA"}
        </button>

        {isTokenMode && (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-cyan-200 text-lg underline hover:text-cyan-300"
          >
            Voltar para o login
          </button>
        )}
      </form>
    </div>
  );
};
