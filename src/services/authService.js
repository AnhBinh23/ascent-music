const MOCK_ACCOUNTS = [
  {
    id: '1',
    name: 'Nguyễn Văn Admin',
    email: 'admin@ascentmusic.vn',
    password: '123456',
    role: 'admin',
    phone: '0901234567',
  },
  {
    id: '2',
    name: 'Trần Thị Nhân Viên',
    email: 'nv@ascentmusic.vn',
    password: '123456',
    role: 'staff',
    phone: '0902345678',
  },
  {
    id: '3',
    name: 'Nguyễn Thị Mai',
    email: 'gv@ascentmusic.vn',
    password: '123456',
    role: 'teacher',
    phone: '0903456789',
  },
  {
    id: '4',
    name: 'Nguyễn Văn An',
    email: 'hv@ascentmusic.vn',
    password: '123456',
    role: 'student',
    phone: '0904567890',
  },
];

const authService = {
  login: async (email, password) => {
    await new Promise(r => setTimeout(r, 800));
    const user = MOCK_ACCOUNTS.find(
      a => a.email === email && a.password === password
    );
    if (!user) throw new Error('Sai email hoặc mật khẩu!');
    const { password: _, ...userInfo } = user;
    return userInfo;
  },
  getAccounts:    async () => MOCK_ACCOUNTS,
  createAccount:  async (data) => ({ success: true, data }),
  updateAccount:  async (id, data) => ({ success: true }),
  toggleStatus:   async (id, status) => ({ success: true }),
  changePassword: async (id, pw) => ({ success: true }),
};

export default authService;