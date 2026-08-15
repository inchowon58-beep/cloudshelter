import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Philosophy from "./components/Philosophy";
import Products from "./components/Products";
import Reviews from "./components/Reviews";
import Concept from "./components/Concept";
import Gallery from "./components/Gallery";
import FAQ from "./components/FAQ";
import ArticlesScroll from "./components/ArticlesScroll";
import OrderForm from "./components/OrderForm";
import { listPageSummaries } from "@/lib/seo-pages";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const pages = await listPageSummaries();

  return (
    <>
      <Hero />
      <Problem />
      <Philosophy />
      <Products />
      <Reviews />
      <Concept />
      <Gallery />
      <FAQ />
      <ArticlesScroll pages={pages} />
      <OrderForm />
    </>
  );
}
