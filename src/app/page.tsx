import Hero from "./components/Hero";
import About from "./components/About";
import Pets from "./components/Pets";
import Process from "./components/Process";
import Reviews from "./components/Reviews";
import Gallery from "./components/Gallery";
import FAQ from "./components/FAQ";
import ArticlesScroll from "./components/ArticlesScroll";
import ContactForm from "./components/ContactForm";
import { listPageSummaries } from "@/lib/seo-pages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let pages: Awaited<ReturnType<typeof listPageSummaries>> = [];
  try {
    pages = await listPageSummaries();
  } catch {
    pages = [];
  }

  return (
    <>
      <Hero />
      <About />
      <Pets />
      <Process />
      <Reviews />
      <Gallery />
      <FAQ />
      <ArticlesScroll pages={pages} />
      <ContactForm />
    </>
  );
}
