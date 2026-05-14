import type { User } from '../types';

export interface MockUser extends User {
    password: string;
}

export const MOCK_USERS: MockUser[] = [
    {
        id: 'admin_1',
        name: 'مدير ادارة بناء ورعاية المساجد',
        email: 'abdalla.alyassi@sia.gov.ae',
        password: 'Sia@2026',
        role: 'manager',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0284c7&color=fff'
    },
    {
        id: 'eng_1',
        name: 'المهندس محمد طارق',
        email: 'mohamed.tareq@sia.gov.ae',
        password: 'Sia@2026',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Mohamed+Tariq&background=6366f1&color=fff'
    },
    {
        id: 'eng_2',
        name: 'المهندس محمد حمدي',
        email: 'mohamed.hamdy@sia.gov.ae',
        password: 'Sia@2026',
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
        email: 'moaaz.mohamed@sia.gov.ae',
        password: 'Sia@2026',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Moaz+Mohamed&background=6366f1&color=fff'
    },
    {
        id: 'eng_6',
        name: 'المهندس عبدالله الطنطاوي',
        email: 'abdallah.osama@sia.gov.ae',
        password: 'Sia@2026',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Abdullah+Tantawy&background=6366f1&color=fff'
    },
    {
        id: 'eng_7',
        name: 'المهندس عبدالرحمن الطنطاوي',
        email: 'abdelrahaman.tantawi@sia.gov.ae',
        password: 'Sia@2026',
        role: 'engineer',
        avatar: 'https://ui-avatars.com/api/?name=Abdulrahman+Tantawy&background=6366f1&color=fff'
    }
];
