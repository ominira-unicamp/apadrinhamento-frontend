import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { MenuItem, Select, Slider, TextField } from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import UserService from "../services/user/UserService";
import { authService } from "../services/auth/AuthService";
import { jwtDecode } from "jwt-decode";
import { ApiWithToken } from "../services/ApiConfig";

import Logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  email: z.string().regex(/^[a-zA-Z][0-9]{6}@dac.unicamp.br$/, "Use seu email institucional da UNICAMP"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
  name: z.string().min(1, "Nome é obrigatório"),
  telephone: z.string().regex(/^\d{11}$/, "Telefone para contato"),
  course: z.enum(["CC", "EC"], { required_error: "Selecione seu curso" }),
  role: z.enum(["bixe", "veterane"], { required_error: "Selecione uma opção" }),
  yearOfEntry: z.number({ required_error: "Ano de ingresso é obrigatório" }).int().min(1900).max(new Date().getFullYear() + 1, "Ano inválido"),
  pronouns: z.array(z.string()),
  otherPronouns: z.string().optional(),
  ethnicity: z.array(z.string()),
  otherEthnicity: z.string().optional(),
  city: z.string().min(1, "Informe sua cidade").refine((city: string) => city != 'Cidade', { message: 'Informe sua cidade' }),
  lgbt: z.array(z.string()),
  otherLgbt: z.string().optional(),
  parties: z.number().min(0).max(10),
  hobby: z.string().optional(),
  music: z.string().optional(),
  games: z.string().optional(),
  sports: z.string().optional(),
  picture: z.any().optional().refine((picture: any) => !picture?.length || ACCEPTED_IMAGE_TYPES.includes(picture[0]?.type), { message: "Selecione uma imagem válida" }).refine((picture: any) => !picture?.length || picture[0]?.size <= 5242880, { message: 'Imagem muito grande. Limite: 5MB' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type formType = z.infer<typeof formSchema>;

interface citiesData {
  id: number;
  nome: string;
}

export const SignupPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
    shouldUseNativeValidation: false,
    reValidateMode: "onBlur",
    defaultValues: {
      pronouns: [],
      lgbt: [],
      ethnicity: [],
      parties: 5,
    }
  });

  const authCtx = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const formatTelephone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    
    if (digits.length <= 2) {
      return `(${digits.padEnd(2, '_')})_____-____`;
    } else if (digits.length <= 3) {
      return `(${digits.slice(0, 2)})${digits.slice(2)}${'_'.repeat(4 - digits.slice(2).length)}-____`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)})${digits.slice(2, 3)}${digits.slice(3).padEnd(4, '_')}-____`;
    } else {
      return `(${digits.slice(0, 2)})${digits.slice(2, 3)}${digits.slice(3, 7)}-${digits.slice(7).padEnd(4, '_')}`;
    }
  };
  
  const getTelephoneDigits = (formatted: string) => {
    return formatted.replace(/\D/g, '').slice(0, 11);
  };

  const onSubmit = async (data: formType) => {
    if(data.otherEthnicity) {
      data.ethnicity.push(data.otherEthnicity);
    }
    if(data.otherPronouns) {
      data.pronouns.push(data.otherPronouns);
    }
    if(data.otherLgbt) {
      data.lgbt.push(data.otherLgbt);
    }

    if (data.picture.length > 0) {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(data.picture[0]);
      });
      data.picture = await base64Promise;
    } else {
      data.picture = undefined;
    }

   
    if (!state?.edit && !authCtx.token) {
      try {
        const { confirmPassword, otherPronouns, otherEthnicity, otherLgbt, picture, ...signupData } = data;
        
        const pendingToast = toast.loading("Criando sua conta...");
        const signupResponse = await authService.signup(signupData);
        toast.dismiss(pendingToast);
        
        const token = signupResponse.data.access_token;
        const userId = jwtDecode<{id: string}>(token).id;
        
        authCtx.login({ email: data.email, password: data.password }).catch(console.error);
        

        if (picture) {
          await toast.promise(
            ApiWithToken(token).put(`/users/${userId}`, { picture }),
            {
              success: {
                render: ({data}) => {
                  if (data.data.status == true)
                    authCtx.status = true;
                  navigate('/dashboard');
                  return "Cadastrado com Sucesso";
                },
              },
              pending: "Salvando foto...",
              error: "Erro ao salvar foto"
            }
          );
        } else {
          toast.success("Cadastrado com Sucesso");
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Signup error details:", error);
        const errorMessage = error?.message || "Erro ao criar conta. Por favor, tente novamente.";
        toast.error(errorMessage);
        return;
      }
    } else {
      const { email, password, confirmPassword, ...profileData } = data;
      await toast.promise(UserService.update(jwtDecode<{id: string}>(authCtx.token).id, profileData as any), {
          success: {
            render: ({data}) => {
              if (data.status == true)
                authCtx.status = true;
              navigate('/dashboard');
              return "Atualizado com Sucesso";
            },
          },
          pending: "Carregando...",
          error: "Erro desconhecido ao fazer cadastro"
      });
    }
  };

  const role = watch("role");
  const course = watch("course");

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

  const [cities, setCities] = useState<citiesData[]>([]);
  const [submittedPic, setSubmittedPic] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string>("");


  const handleStateChange = async (response: AxiosResponse) => {
    if (response.status === 200) setCities(response.data as citiesData[]);
  };

  useEffect(() => {
    if (authCtx.status == true && !(state?.edit))
      navigate("/dashboard");

    if (state?.edit) {
      UserService.get(jwtDecode<{id: string}>(authCtx.token).id).then(async (response) => {
        setValue("name", response.name, { shouldValidate: false, shouldDirty: false });
        setValue("course", response.course, { shouldValidate: false, shouldDirty: false });
        setValue("role", response.role, { shouldValidate: false, shouldDirty: false });
        if (response.telephone) {
          setValue("telephone", response.telephone, { shouldValidate: false, shouldDirty: false });
        }
        if (response.yearOfEntry) {
          setValue("yearOfEntry", response.yearOfEntry, { shouldValidate: false, shouldDirty: false });
        }
        setValue("otherPronouns", response.pronouns.filter((v) => !["Ela/Dela", "Ele/Dele", "Elu/Delu"].includes(v))[0]);
        setValue("pronouns", response.pronouns.filter((v) => ["Ela/Dela", "Ele/Dele", "Elu/Delu"].includes(v)));
        setValue("otherEthnicity", response.ethnicity.filter((v) => !["Preta", "Branca", "Parda", "Amarela", "Indígena"].includes(v))[0]);
        setValue("ethnicity", response.ethnicity.filter((v) => ["Preta", "Branca", "Parda", "Amarela", "Indígena"].includes(v)));
        
        // Load state and cities if city is present
        if (response.city && response.city !== 'Cidade') {
          try {
            // Search for the city to find which state it belongs to
            const citySearchResponse = await axios.get(
              `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${encodeURIComponent(response.city)}`
            );
            
            if (citySearchResponse.data) {
              const stateId = citySearchResponse.data.microrregiao.mesorregiao.UF.id.toString();
              setSelectedState(stateId);
              
              // Fetch cities for this state
              const citiesResponse = await axios.get(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios?orderBy=nome`
              );
              handleStateChange(citiesResponse);
            }
          } catch (error) {
            console.error("Error loading city/state:", error);
          }
        }
        
        setValue("city", response.city || 'Cidade');
        setValue("otherLgbt", response.lgbt.filter((v) => !["Lésbica", "Gay", "Bissexual", "Trans", "Queer", "Intersexo", "Assexual"].includes(v))[0]);
        setValue("lgbt", response.lgbt.filter((v) => ["Lésbica", "Gay", "Bissexual", "Trans", "Queer", "Intersexo", "Assexual"].includes(v)));
        setValue("parties", response.parties);
        setValue("hobby", response.hobby);
        setValue("music", response.music);
        setValue("games", response.games);
        setValue("sports", response.sports);
        if (response.picture) {
          setSubmittedPic(true);
        }
      });
    }
  }, [authCtx.status, state?.edit]);

  return (
    <div className="w-full min-h-screen bg-zinc-800 flex flex-col items-center p-5 gap-y-6 text-white">
      {state?.edit && (
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
        Bem-vinde ao Sistema de Apadrinhamento da Computação
      </h1>
      <p className="mt-8 text-xl max-w-3xl text-rose-100 text-center">
        Preencha com sinceridade. Utilizaremos esses dados para encontrar o par
        mais compatível na Computação UNICAMP
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-5 w-full max-w-lg bg-zinc-700 p-6 rounded-lg flex flex-col gap-10"
      >
        <TextField
          label="E-mail institucional"
          variant="outlined"
          type="email"
          placeholder="a123456@dac.unicamp.br"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register("email")}
        />
        {errors.email && (
          <span className="text-red-400">{errors.email.message}</span>
        )}

        <TextField
          label="Senha"
          variant="outlined"
          type="password"
          placeholder="Mínimo 8 caracteres"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register("password")}
        />
        {errors.password && (
          <span className="text-red-400">{errors.password.message}</span>
        )}

        <TextField
          label="Confirmar Senha"
          variant="outlined"
          type="password"
          placeholder="Digite a senha novamente"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <span className="text-red-400">{errors.confirmPassword.message}</span>
        )}
        
        <TextField
          label="Qual seu nome?"
          variant="standard"
          type="text"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: state?.edit && watch('name') } }}
          {...register("name")}
        />
        {errors.name && (
          <span className="text-red-400">{errors.name.message}</span>
        )}
        
        <TextField
          label="Telefone"
          variant="outlined"
          type="tel"
          placeholder="(__)_____-____"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: true } }}
          value={watch('telephone') ? formatTelephone(watch('telephone') || '') : ''}
          onChange={(e) => {
            const cursorPosition = e.target.selectionStart || 0;
            const oldValue = watch('telephone') || '';
            const digits = getTelephoneDigits(e.target.value);
            setValue("telephone", digits);
            
            // Restore cursor position on next tick
            setTimeout(() => {
              if (e.target.selectionStart !== null) {
                // Calculate new cursor position based on digit count change
                const oldDigits = oldValue.length;
                const newDigits = digits.length;
                const diff = newDigits - oldDigits;
                const newPosition = Math.max(0, Math.min(cursorPosition + diff, e.target.value.length));
                e.target.setSelectionRange(newPosition, newPosition);
              }
            }, 0);
          }}
        />
        {errors.telephone && (
          <span className="text-red-400">{errors.telephone.message}</span>
        )}
        
        {!submittedPic && (
          <>
            <div>
              <p>Se quiser, escolha uma foto para se apresentar:</p>
              <input type="file" multiple={false} className="mt-2 file:bg-white file:rounded-lg file:text-black file:px-2" accept="image/*"{...register("picture")} />
            </div>
            { errors.picture && 
              <span className="text-red-400">
                {errors.picture?.message?.toString()}
              </span>
            }
          </>
        )}

        <div className="flex flex-col gap-2">
          <p>Qual curso você se matriculou?</p>
          <div className="text-black flex justify-evenly">
            <button
              type="button"
              className={`cursor-pointer w-1/3 px-3 py-1 rounded-full ${
                course == "CC" ? "bg-cyan-200" : "bg-white"
              }`}
              onClick={() =>
                setValue("course", "CC", {
                  shouldDirty: false,
                  shouldValidate: false,
                  shouldTouch: false,
                })
              }
            >
              CC
            </button>
            <button
              type="button"
              className={`cursor-pointer w-1/3 px-3 py-1 rounded-full ${
                course == "EC" ? "bg-cyan-200" : "bg-white"
              }`}
              onClick={() =>
                setValue("course", "EC", {
                  shouldDirty: false,
                  shouldValidate: false,
                  shouldTouch: false,
                })
              }
            >
              EC
            </button>
          </div>
          {errors.course && 
            <span className="text-red-400">
              {errors.course.message}
            </span>
          }
        </div>

        <div className="flex flex-col gap-2">
          <p>Ano de Ingresso</p>
          <Select
            variant="standard"
            sx={{ ":before": { borderBottomColor: "white" }, color: "white", ':hover': { borderBottomColor: "white" } }}
            value={watch("yearOfEntry") ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                return;
              }
              setValue("yearOfEntry", parseInt(value as string), { shouldValidate: true, shouldDirty: true });
            }}
          >
            <MenuItem value=""><em className="text-zinc-400">Selecione o ano</em></MenuItem>
            {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
            <MenuItem value={1900}>Dino 🦕</MenuItem>
          </Select>
          {errors.yearOfEntry && 
            <span className="text-red-400">
              {errors.yearOfEntry.message}
            </span>
          }
        </div>

        <div className="flex flex-col gap-2">
          <p>Você é...</p>
          <div className="text-black flex justify-evenly">
            <button
              type="button"
              className={`cursor-pointer w-1/3 px-3 py-1 rounded-full ${
                role == "bixe" ? "bg-cyan-200" : "bg-white"
              }`}
              onClick={() =>
                setValue("role", "bixe", {
                  shouldDirty: false,
                  shouldValidate: false,
                  shouldTouch: false,
                })
              }
            >
              Bixe
            </button>
            <button
              type="button"
              className={`cursor-pointer w-1/3 px-3 py-1 rounded-full ${
                role == "veterane" ? "bg-cyan-200" : "bg-white"
              }`}
              onClick={() =>
                setValue("role", "veterane", {
                  shouldDirty: false,
                  shouldValidate: false,
                  shouldTouch: false,
                })
              }
            >
              Veterane
            </button>
          </div>
          {errors.role && 
            <span className="text-red-400">
              {errors.role.message}
            </span>
          }
        </div>

        <p>Quais são seus pronomes?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Ela/Dela"
              {...register("pronouns")}
            />{" "}
            Ela/Dela
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Ele/Dele"
              {...register("pronouns")}
            />{" "}
            Ele/Dele
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Elu/Delu"
              {...register("pronouns")}
            />{" "}
            Elu/Delu
          </label>
          <TextField
            type="text"
            variant="standard"
            label="Outros:"
            slotProps={{ inputLabel: { shrink: state?.edit && watch('otherPronouns') } }}
            sx={inputStyle}
            className="w-26 justify-self-center !mb-4"
            {...register("otherPronouns")}
          />
        </div>
        {errors.pronouns && (
          <span className="text-red-400">{errors.pronouns.message}</span>
        )}

        <p>Qual sua etnia?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 justify-evenly items-center">
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Preta"
              {...register("ethnicity")}
            />{" "}
            Preta
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Branca"
              {...register("ethnicity")}
            />{" "}
            Branca
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Parda"
              {...register("ethnicity")}
            />{" "}
            Parda
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Amarela"
              {...register("ethnicity")}
            />{" "}
            Amarela
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Indígena"
              {...register("ethnicity")}
            />{" "}
            Indígena
          </label>
          <TextField
            type="text"
            variant="standard"
            label="Outra:"
            sx={inputStyle}
            slotProps={{ inputLabel: { shrink: state?.edit && watch('otherEthnicity') } }}
            className="w-26 justify-self-center !mb-4"
            {...register("otherEthnicity")}
          />
        </div>
        {errors.ethnicity && (
          <span className="text-red-400">{errors.ethnicity.message}</span>
        )}

        <p>De onde você é?</p>
        <Select
          variant="standard"
          sx={{ ":before": { borderBottomColor: "white" }, color: "white", ':hover': { borderBottomColor: "white" }, }}
          value={selectedState || ""}
          onChange={async (e) => {
            const stateId = e.target.value as string;
            setSelectedState(stateId);
            axios
              .get(
                `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios?orderBy=nome`
              )
              .then((response) => handleStateChange(response));
          }}
        >
          <MenuItem value=""><em className="text-zinc-400">Selecione o estado</em></MenuItem>
          <MenuItem value="27">Alagoas</MenuItem>
          <MenuItem value="12">Acre</MenuItem>
          <MenuItem value="16">Amapá</MenuItem>
          <MenuItem value="13">Amazonas</MenuItem>
          <MenuItem value="29">Bahia</MenuItem>
          <MenuItem value="23">Ceará</MenuItem>
          <MenuItem value="53">Distrito Federal</MenuItem>
          <MenuItem value="32">Espírito Santo</MenuItem>
          <MenuItem value="52">Goiás</MenuItem>
          <MenuItem value="21">Maranhão</MenuItem>
          <MenuItem value="51">Mato Grosso</MenuItem>
          <MenuItem value="50">Mato Grosso do Sul</MenuItem>
          <MenuItem value="31">Minas Gerais</MenuItem>
          <MenuItem value="15">Pará</MenuItem>
          <MenuItem value="25">Paraíba</MenuItem>
          <MenuItem value="41">Paraná</MenuItem>
          <MenuItem value="26">Pernambuco</MenuItem>
          <MenuItem value="22">Piauí</MenuItem>
          <MenuItem value="33">Rio de Janeiro</MenuItem>
          <MenuItem value="24">Rio Grande do Norte</MenuItem>
          <MenuItem value="43">Rio Grande do Sul</MenuItem>
          <MenuItem value="11">Rondônia</MenuItem>
          <MenuItem value="14">Roraima</MenuItem>
          <MenuItem value="42">Santa Catarina</MenuItem>
          <MenuItem value="35">São Paulo</MenuItem>
          <MenuItem value="28">Sergipe</MenuItem>
          <MenuItem value="17">Tocantins</MenuItem>
        </Select>
        <Select
          variant="standard"
          label="Cidade"
          sx={{ ":before": { borderBottomColor: "white" }, color: "white" }}
          value={watch("city") || "Cidade"}
          onChange={(e) => {
            setValue("city", e.target.value as string, { shouldValidate: true, shouldDirty: true });
          }}
        >
            <MenuItem value="Cidade"><em className="text-zinc-400">Cidade</em></MenuItem>
          {cities.map((city) => (
            <MenuItem key={city.id} value={city.nome}>{city.nome}</MenuItem>
          ))}
        </Select>
        {errors.city && (
          <span className="text-red-400">{errors.city.message}</span>
        )}

        <p>Você se idenfica como parte da comunidade LGBTQIA+? Se sim, qual?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Lésbica"
              {...register("lgbt")}
            />{" "}
            Lésbica
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Gay"
              {...register("lgbt")}
            />{" "}
            Gay
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Bissexual"
              {...register("lgbt")}
            />{" "}
            Bissexual
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Trans"
              {...register("lgbt")}
            />{" "}
            Trans
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Queer"
              {...register("lgbt")}
            />{" "}
            Queer
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Intersexo"
              {...register("lgbt")}
            />{" "}
            Intersexo
          </label>
          <label className="flex justify-center items-center gap-2 text-lg">
            <input
              className="cursor-pointer rounded-md appearance-none w-5 h-5 not-checked:bg-white checked:bg-cyan-200"
              type="checkbox"
              value="Assexual"
              {...register("lgbt")}
            />{" "}
            Assexual
          </label>
          <TextField
            type="text"
            variant="standard"
            label="Outra:"
            sx={inputStyle}
            slotProps={{ inputLabel: { shrink: state?.edit && watch('otherLgbt') } }}
            className="w-26 justify-self-center !mb-4"
            {...register("otherLgbt")}
          />
        </div>

        <p>Curte rolês e festas?</p>
        <div>
            <Slider 
            aria-label="Festas"
            min={0}
            max={10}
            defaultValue={5}
            value={watch('parties')}
            sx={{ color: "#a2f4fd" }}
            valueLabelDisplay="auto"
            onChange={(_, value) => setValue("parties", value as number)}
            />
            <div className="flex justify-between">
                <p>Pouco</p>
                <p>Muito</p>
            </div>
        </div>

        <TextField
          type="text"
          variant="standard"
          label="O que você mais gosta de fazer?"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: state?.edit && watch('hobby') } }}
          {...register("hobby")}
        />
        <TextField
          type="text"
          variant="standard"
          label="Qual gênero musical ou artista que te define?"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: state?.edit && watch('music') } }}
          {...register("music")}
        />
        <TextField
          type="text"
          variant="standard"
          label="Gosta de videogames? Se sim, quais?"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: state?.edit && watch('games') } }}
          {...register("games")}
        />
        <TextField
          type="text"
          variant="standard"
          label="Gosta de esportes? Se sim, quais?"
          sx={inputStyle}
          slotProps={{ inputLabel: { shrink: state?.edit && watch('sports') } }}
          {...register("sports")}
        />

        <button
          type="submit"
          className="bg-amber-600 text-white py-2 rounded-lg cursor-pointer"
        >
          ENTREGAR
        </button>
      </form>
    </div>
  );
};
