import type { User } from '../types';

export interface MockUser extends User {
    password: string;
}

export const MOCK_USERS: MockUser[] = [
    {
        id: 'admin_1',
        name: 'إدارة مساجد الشارقة (المدير)',
        email: 'admin@mosque.gov.ae',
        password: 'admin',
        role: 'manager',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=0284c7&color=fff'
    },
    {
        id: 'cons_1',
        name: 'مكتب مزايا للاستشارات',
        email: 'aboodtantawi1911@gmail.com',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Mazaya&background=0d9488&color=fff'
    },
    {
        id: 'cons_2',
        name: 'مكتب البراجيل للاستشارات',
        email: 'albarajeel@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Al+Barajeel&background=0d9488&color=fff'
    },
    {
        id: 'cons_3',
        name: 'مكتب النهضة للاستشارات',
        email: 'alnahda@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Al+Nahda&background=0d9488&color=fff'
    },
    {
        id: 'cons_4',
        name: 'مكتب الرؤية لمتكامله تشارات',
        email: 'integrated@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Integrated&background=0d9488&color=fff'
    },
    {
        id: 'cons_5',
        name: 'مكتب البيت للاستشارات',
        email: 'albait@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Al+Bait&background=0d9488&color=fff'
    },
    {
        id: 'cons_6',
        name: 'مكتب الماسة للاستشارات',
        email: 'almasa@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Al+Masa&background=0d9488&color=fff'
    },
    {
        id: 'cons_7',
        name: 'مكتب الدانة العربية للاستشارات',
        email: 'aldana@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Al+Dana&background=0d9488&color=fff'
    },
    {
        id: 'cons_8',
        name: 'مكتب أحجار الإمارات للاستشارات',
        email: 'stones@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Stones&background=0d9488&color=fff'
    },
    {
        id: 'cons_9',
        name: 'مكتب دار العمارة للاستشارات',
        email: 'daralamara@cons.ae',
        password: '123',
        role: 'consultant',
        avatar: 'https://ui-avatars.com/api/?name=Dar+Al+Amara&background=0d9488&color=fff'
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
