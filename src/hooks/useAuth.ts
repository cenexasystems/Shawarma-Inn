import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const auth = useAuthContext();

  return {
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    signup: auth.signup,
    login: auth.login,
    adminLogin: auth.adminLogin,
    logout: auth.logout,
    refreshUser: auth.refreshUser,
    updateProfile: auth.updateProfile,
  };
};
