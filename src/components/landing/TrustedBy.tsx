import hermanosDiazLogo from "@/assets/hermanos-diaz-logo.png";
import foundersAlleyLogo from "@/assets/founders-alley-logo.jpeg";
import kommunityLogo from "@/assets/kommunity-logo.png";

export const TrustedBy = () => {
  const logos = [
    { name: "Hermanos Diaz Tire Shop", src: hermanosDiazLogo },
    { name: "Founders Alley", src: foundersAlleyLogo },
    { name: "Kommunity", src: kommunityLogo },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl md:text-3xl font-bold mb-12">
          Trusted By Growing Businesses
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-16 md:h-20 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
