
export interface UsuarioData {
  _id: string;
  apellido: string;
  correo: string;
  estado: string;
  fecha_creacion: string;
  grado: string;
  nombre: string;
  rol: string;
  seccion: string;
  usuario_id: number;
}

const USER_KEY = 'usuario_data';

export const UserStorage = {
  setUser(user: UsuarioData) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser(): UsuarioData | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem(USER_KEY);
  }
};
