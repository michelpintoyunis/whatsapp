import MainContainer from "@/components/layout/MainContainer";

export default function Home() {
  return (
    <main className="w-full h-full xl:max-w-[1600px] xl:py-[19px] mx-auto relative z-10">
      <div className="w-full h-full bg-wa-bg-panel flex xl:shadow-2xl overflow-hidden relative">
        <MainContainer />
      </div>
    </main>
  );
}
