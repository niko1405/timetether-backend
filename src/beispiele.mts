// Copyright (C) 2025 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// Aufruf:  bun i
//          bun --env-file=.env prisma generate
//
//          bun --env-file=.env src\beispiele.mts

import { PrismaPg } from '@prisma/adapter-pg';
import { prismaQueryInsights } from '@prisma/sqlcommenter-query-insights';
import process from 'node:process';
import { styleText } from 'node:util';
import {
    PrismaClient,
    type AppProfile,
    type Prisma,
} from './generated/prisma/client.ts';

let message = styleText(['black', 'bgWhite'], 'Node version');
console.log(`${message}=${process.version}`);
message = styleText(['black', 'bgWhite'], 'DATABASE_URL');
console.log(`${message}=${process.env['DATABASE_URL']}`);
console.log();

// "named parameter" durch JSON-Objekt
const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL'],
});

// union type
const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = [
    {
        // siehe unten: prisma.$on('query', ...);
        emit: 'event',
        level: 'query',
    },
    'info',
    'warn',
    'error',
];

// PrismaClient passend zur Umgebungsvariable DATABASE_URL in ".env"
// d.h. mit PostgreSQL-User fuer Schema "timetether"
const prisma = new PrismaClient({
    // shorthand property
    adapter,
    errorFormat: 'pretty',
    log,
    // Kommentar zu Log-Ausgabe:
    // /*prismaQuery='Buch.findMany%3A...
    comments: [prismaQueryInsights()],
});
prisma.$on('query', (e) => {
    message = styleText('green', `Query: ${e.query}`);
    console.log(message);
    message = styleText('cyan', `Duration: ${e.duration} ms`);
    console.log(message);
});

export type ProfilMitConfigUndAvatar = Prisma.AppProfileGetPayload<{
    include: {
        trackingConfig: true;
        profileAvatar: true;
    };
}>;

// Operationen mit dem Model "AppProfile"
try {
    await prisma.$connect();

    // Das Resultat ist null, falls kein Datensatz gefunden
    const profil: AppProfile | null = await prisma.appProfile.findFirst();
    message = styleText(['black', 'bgWhite'], 'profil');
    console.log(`${message} = %j`, profil);
    console.log();

    // SELECT *
    // FROM   app_profile
    // JOIN   tracking_config/profile_avatar ueber profile_id
    // WHERE  display_name LIKE "%n%"
    const profile: ProfilMitConfigUndAvatar[] = await prisma.appProfile.findMany({
        where: {
            displayName: {
                // https://www.prisma.io/docs/orm/reference/prisma-client-reference#filter-conditions-and-operators
                contains: 'n',
            },
        },
        // Fetch-Join mit Tracking-Config und Avatar
        include: {
            trackingConfig: true,
            profileAvatar: true,
        },
    });
    message = styleText(['black', 'bgWhite'], 'profileMitConfigUndAvatar');
    console.log(`${message} = %j`, profile);
    console.log();

    // higher-order function und arrow function
    const currentStreaks = profile.map((p) => p.currentStreak);
    message = styleText(['black', 'bgWhite'], 'currentStreaks');
    console.log(`${message} = %j`, currentStreaks);
    console.log();

    // union type
    const taeglicheLimits = profile.map((p) => p.trackingConfig?.dailyLimitMinutes);
    message = styleText(['black', 'bgWhite'], 'taeglicheLimits');
    console.log(`${message} = %j`, taeglicheLimits);
    console.log();

    // Pagination
    const profileSeite2: AppProfile[] = await prisma.appProfile.findMany({
        skip: 5,
        take: 5,
    });
    message = styleText(['black', 'bgWhite'], 'profileSeite2');
    console.log(`${message} = %j`, profileSeite2);
    console.log();
} finally {
    await prisma.$disconnect();
}

// PrismaClient mit PostgreSQL-User "postgres", d.h. mit Administrationsrechten
const adapterAdmin = new PrismaPg({
    connectionString: process.env['DATABASE_URL_ADMIN'],
});
const prismaAdmin = new PrismaClient({ adapter: adapterAdmin });
try {
    const profileAdmin: AppProfile[] = await prismaAdmin.appProfile.findMany({
        where: {
            displayName: {
                contains: 'n',
            },
        },
    });
    message = styleText(['black', 'bgWhite'], 'profileAdmin');
    console.log(`${message} = ${JSON.stringify(profileAdmin)}`);
} finally {
    await prismaAdmin.$disconnect();
}
