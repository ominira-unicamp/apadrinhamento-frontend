import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import Logo from "../assets/logo.png";
import UserService from "../services/user/UserService";

const forgotPasswordSchema = z.object({
  email: z.string().regex(/^[a-zA-Z][0-9]{6}@dac.unicamp.br$/),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (errors.email) {
      return;
    }

    const pendingToast = toast.loading("Enviando email...");

    try {
      await UserService.resetPassword(data.email);
      toast.dismiss(pendingToast);
      toast.success("Se o email existir, enviamos um link de redefinicao");
    } catch (error) {
      toast.dismiss(pendingToast);
      console.error("Forgot password error:", error);
      toast.error("Erro ao solicitar redefinicao de senha");
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-5 p-2 pt-7 bg-zinc-800 overflow-y-scroll">
      <img src={Logo} className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square" />
      <h1 className="text-4xl text-center font-extrabold text-cyan-200">
        Esqueceu a senha?
      </h1>
      <p className="mt-8 text-xl max-w-3xl text-rose-100 text-center">
        Informe seu e-mail institucional para receber o link de redefinicao
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 w-5/6 lg:w-1/3 md:w-4/6 flex flex-col gap-3 bg-zinc-700 p-6 rounded-lg"
      >
        <label htmlFor="email" className="text-lg text-white">
          E-mail:
        </label>
        <input
          type="email"
          id="email"
          className={`w-full border-1 border-${
            errors.email ? "red" : "gray"
          }-400 p-4 rounded-lg text-white`}
          {...register("email", { required: true })}
        />
        <button
          className="mt-6 bg-amber-600 text-white text-xl font-bold py-2 px-4 rounded-lg cursor-pointer"
          type="submit"
        >
          Enviar Link
        </button>
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 text-cyan-200 text-lg underline hover:text-cyan-300 cursor-pointer"
        >
          Voltar para o login
        </button>
      </form>
    </div>
  );
};
