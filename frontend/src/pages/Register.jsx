import RegisterForm from "../components/common/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        <RegisterForm />

      </div>

    </div>
  );
};

export default Register;