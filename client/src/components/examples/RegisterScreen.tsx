import { RegisterScreen } from "../RegisterScreen";

export default function RegisterScreenExample() {
  return (
    <RegisterScreen
      onRegister={() => console.log("Registration successful")}
      onNavigateToLogin={() => console.log("Navigate to login")}
    />
  );
}
