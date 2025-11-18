import { LoginScreen } from "../LoginScreen";

export default function LoginScreenExample() {
  return (
    <LoginScreen
      onLogin={() => console.log("Login successful")}
      onNavigateToRegister={() => console.log("Navigate to register")}
    />
  );
}
