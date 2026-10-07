export function HomeStyles() {
  return (
    <style jsx global>{`
      @keyframes floatOne {
        0%,
        100% {
          transform: translate3d(0, 0, 0);
        }

        50% {
          transform: translate3d(24px, 30px, 0);
        }
      }

      @keyframes floatTwo {
        0%,
        100% {
          transform: translate3d(0, 0, 0);
        }

        50% {
          transform: translate3d(-28px, 25px, 0);
        }
      }

      @keyframes cardFloat {
        0%,
        100% {
          transform: translateY(0) rotate(8deg);
        }

        50% {
          transform: translateY(-18px) rotate(6deg);
        }
      }

      @keyframes cardFloatReverse {
        0%,
        100% {
          transform: translateY(0) rotate(-9deg);
        }

        50% {
          transform: translateY(16px) rotate(-6deg);
        }
      }

      @keyframes featuredFloat {
        0%,
        100% {
          transform: translate(-50%, -50%);
        }

        50% {
          transform: translate(-50%, calc(-50% - 12px));
        }
      }

      @keyframes marquee {
        from {
          transform: translateX(0);
        }

        to {
          transform: translateX(-50%);
        }
      }

      .hero-orb-one {
        animation: floatOne 9s ease-in-out infinite;
      }

      .hero-orb-two {
        animation: floatTwo 11s ease-in-out infinite;
      }

      .floating-card {
        animation: cardFloat 7s ease-in-out infinite;
      }

      .floating-card-reverse {
        animation: cardFloatReverse 8s ease-in-out infinite;
      }

      .featured-float {
        animation: featuredFloat 6s ease-in-out infinite;
      }

      .marquee-track {
        animation: marquee 24s linear infinite;
      }

      .category-card {
        transition:
          transform 350ms ease,
          box-shadow 350ms ease;
      }

      .category-card:hover {
        transform: translateY(-10px) rotate(-1deg);
        box-shadow: 0 25px 60px rgba(31, 20, 47, 0.14);
      }

      .event-card {
        transition:
          transform 350ms ease,
          border-color 350ms ease,
          box-shadow 350ms ease;
      }

      .event-card:hover {
        transform: translateY(-12px);
        border-color: rgba(244, 114, 182, 0.4);
        box-shadow: 0 35px 80px rgba(0, 0, 0, 0.4);
      }

      .event-shine {
        background: linear-gradient(
          115deg,
          transparent 30%,
          rgba(255, 255, 255, 0.18) 48%,
          transparent 66%
        );
        transform: translateX(-130%);
        transition: transform 750ms ease;
      }

      .event-card:hover .event-shine {
        transform: translateX(130%);
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-orb-one,
        .hero-orb-two,
        .floating-card,
        .floating-card-reverse,
        .featured-float,
        .marquee-track {
          animation: none;
        }
      }
    `}</style>
  );
}
