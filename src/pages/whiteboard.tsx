import Logo from "../assets/logo.png";

export const WhiteboardPage = () => {
    return (
        <div className="w-full min-h-screen bg-zinc-800 flex flex-col items-center justify-center p-5 gap-y-6 text-white">
            <img
                src={Logo}
                className="w-1/2 lg:w-1/6 md:w-1/4 h-fit aspect-square"
            />
            <h1 className="text-4xl text-center font-extrabold text-cyan-200">
                Obrigado por se cadastrar!
            </h1>
            <p className="mt-4 text-xl max-w-3xl text-rose-100 text-center">
                Em breve você será notificade sobre o seu apadrinhamento.
            </p>
        </div>
    );
};
