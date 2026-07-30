import loaderGif from "../assets/Loader_Gif_V4 1.gif";

type PageLoaderProps = {
  messageLineOne?: string;
  messageLineTwo?: string;
};

export function PageLoader({
  messageLineOne = "Hang On a moment!",
  messageLineTwo = "Bringing the wilderness to you.",
}: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-9999 flex min-h-screen w-full items-center justify-center bg-black/90">
      <div className="flex flex-col items-center text-center">
        <p className="font-['Nunito',Helvetica] text-[16px] font-semibold text-white">
          {messageLineOne}
        </p>
        <p
          className="mt-1 text-[20px] text-white"
          style={{ fontFamily: '"Cocogoose Pro"', fontWeight: 300 }}
        >
          {messageLineTwo}
        </p>
        <img
          src={loaderGif}
          alt="Loading wilderness animation"
          className="mt-6 h-28 w-28 object-contain md:h-32 md:w-32"
        />
      </div>
    </div>
  );
}
