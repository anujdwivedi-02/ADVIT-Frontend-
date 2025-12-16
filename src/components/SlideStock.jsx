import React, { useEffect, useRef } from "react";
import gsap from "gsap";

const stocks = [
  { name: "Apple", price: 184.2, change: "+1.5%" },
  { name: "Google", price: 2741.5, change: "-0.8%" },
  { name: "Amazon", price: 3450.1, change: "+2.3%" },
  { name: "Tesla", price: 691.8, change: "-1.2%" },
  { name: "Microsoft", price: 299.4, change: "+0.9%" },
  { name: "Meta", price: 325.7, change: "-0.5%" },
];

const SlideStock = () => {
  const tickerRef = useRef(null);
  const tweenRef = useRef(null);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    // Initialize after layout to get correct widths
    let raf = requestAnimationFrame(() => {
      const tickerWidth = ticker.scrollWidth / 2;

      // Kill any existing tween
      if (tweenRef.current) {
        tweenRef.current.kill();
      }

      // Create a continuous tween and store reference for pause/resume
      tweenRef.current = gsap.to(ticker, {
        x: -tickerWidth,
        duration: 20,
        ease: "linear",
        repeat: -1,
        modifiers: {
          // keep numeric precision safe
          x: (x) => `${parseFloat(x)}px`,
        },
      });

      // Pause/resume handlers
      const handleEnter = () => tweenRef.current && tweenRef.current.pause();
      const handleLeave = () => tweenRef.current && tweenRef.current.resume();

      ticker.addEventListener("mouseenter", handleEnter);
      ticker.addEventListener("mouseleave", handleLeave);

      // Cleanup
      return () => {
        ticker.removeEventListener("mouseenter", handleEnter);
        ticker.removeEventListener("mouseleave", handleLeave);
        if (tweenRef.current) {
          tweenRef.current.kill();
          tweenRef.current = null;
        }
      };
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full bg-[#111C2E]
 py-3 overflow-hidden">
      <div className="relative flex w-max" ref={tickerRef}>
        {/* Stocks duplicated for seamless loop */}
        {[...stocks, ...stocks].map((stock, index) => (
          <div
            key={index}
            className="flex items-center space-x-3 px-6 py-2 bg-white shadow mx-2 rounded-lg min-w-[200px]"
          >
            <span className="font-semibold text-gray-800">{stock.name}</span>
            <span className="text-gray-600">${stock.price}</span>
            <span
              className={`font-bold ${stock.change.startsWith("+") ? "text-green-600" : "text-red-600"
                }`}
            >
              {stock.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlideStock;
