import type { User } from '../types';

export interface MockUser extends User {
    password: string;
}

export const MOCK_USERS: MockUser[] = [
    {
        id: 'admin_1',
        name: 'مدير ادارة بناء ورعاية المساجد',
        email: 'admin@mosque.gov.ae',
        password: 'admin',
        role: 'manager',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0284c7&color=fff'
    },
    {
        id: 'eng_1',
        name: 'المهندس محمد طارق',
        email: 'tariq@mosque.gov.ae',
        password: 'Tareq2026',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Mohamed+Tariq&background=6366f1&color=fff'
    },
    {
        id: 'eng_2',
        name: 'المهندس محمد حمدي',
        email: 'hamdy@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Mohamed+Hamdy&background=6366f1&color=fff'
    },
    {
        id: 'eng_3',
        name: 'المهندس محمد عاطف',
        email: 'atef@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Mohamed+Atef&background=6366f1&color=fff'
    },
    {
        id: 'eng_4',
        name: 'المهندس عبيد الياسي',
        email: 'obaid@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Obaid+Alyasi&background=6366f1&color=fff'
    },
    {
        id: 'eng_5',
        name: 'المهندس معاذ محمد',
        email: 'moaz@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Moaz+Mohamed&background=6366f1&color=fff'
    },
    {
        id: 'eng_6',
        name: 'المهندس عبدالله الطنطاوي',
        email: 'tantawy@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Abdullah+Tantawy&background=6366f1&color=fff'
    },
    {
        id: 'eng_7',
        name: 'المهندس عبدالرحمن الطنطاوي',
        email: 'abdulrahman@mosque.gov.ae',
        password: '123',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Abdulrahman+Tantawy&background=6366f1&color=fff'
    }
];
