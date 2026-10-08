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

      @keyframes gradientMove {
        0% {
          background-position: 0% 50%;
        }

        50% {
          background-position: 100% 50%;
        }

        100% {
          background-position: 0% 50%;
        }
      }

      @keyframes pulseGlow {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.15;
        }

        50% {
          transform: scale(1.18);
          opacity: 0.28;
        }
      }

      @keyframes badgeFloat {
        0%,
        100% {
          transform: translateY(0);
        }

        50% {
          transform: translateY(-8px);
        }
      }

      .animate-gradient {
        background-size: 200% 200%;
        animation: gradientMove 5s ease infinite;
      }

      .hero-orb-one {
        animation: floatOne 9s ease-in-out infinite;
      }

      .hero-orb-two {
        animation: floatTwo 11s ease-in-out infinite;
      }

      .hero-orb-three {
        animation: pulseGlow 7s ease-in-out infinite;
      }

      .badge-float {
        animation: badgeFloat 4.5s ease-in-out infinite;
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
          transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 350ms ease;
      }

      .category-card:hover {
        transform: translateY(-10px) scale(1.01);
        box-shadow: 0 25px 60px rgba(31, 20, 47, 0.14);
      }

      .event-card {
        transition:
          transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 350ms ease,
          box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1);
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
        .hero-orb-three,
        .badge-float,
        .animate-gradient,
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
