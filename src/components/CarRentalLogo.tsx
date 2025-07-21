import { Car } from "lucide-react";

interface CarRentalLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const CarRentalLogo = ({ size = "md", showText = true }: CarRentalLogoProps) => {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 48, text: "text-3xl" }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-glow rounded-xl blur-lg opacity-30"></div>
        <div className="relative bg-gradient-to-r from-primary to-primary-glow p-3 rounded-xl shadow-elegant">
          <Car 
            size={sizes[size].icon} 
            className="text-primary-foreground" 
            strokeWidth={2.5}
          />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${sizes[size].text} font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent`}>
            Rental Car
          </h1>
          <p className="text-xs text-muted-foreground -mt-1">Car Rental System</p>
        </div>
      )}
    </div>
  );
};

export default CarRentalLogo;