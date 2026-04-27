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

// Aufruf:   bun i
//           bun --env-file=.env prisma generate
//
//           bun --env-file=.env src\beispiele-write.mts

import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { styleText } from 'node:util';
import { PrismaClient, type Prisma } from './generated/prisma/client.ts';

let message = styleText(
    'yellow',
    `process.env['DATABASE_URL']=${process.env['DATABASE_URL']}`,
);
console.log(message);
console.log();

const adapter = new PrismaPg({
    connectionString: process.env['DATABASE_URL_ADMIN'],
});

const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = [
    {
        emit: 'event',
        level: 'query',
    },
    'info',
    'warn',
    'error',
];

// PrismaClient fuer DB "timetether" (siehe Umgebungsvariable DATABASE_URL in ".env")
const prisma = new PrismaClient({
    adapter,
    errorFormat: 'pretty',
    log,
});
prisma.$on('query', (e) => {
    message = styleText('green', `Query: ${e.query}`);
    console.log(message);
    message = styleText('cyan', `Duration: ${e.duration} ms`);
    console.log(message);
});

const neuesBuch: Prisma.AppProfileCreateInput = {
    id: randomUUID(),
    displayName: 'Beispiel',
    statusMessage: 'beispiel',
    timezone: 'Europe/Berlin',
    onboardingCompleted: true,
    // 1:1-Beziehung (unique profileId)
    trackingConfig: {
        create: {
            dailyLimitMinutes: 120,
            isPublic: false,
            notificationsEnabled: true,
        },
    },
    // 1:N-Beziehung
    screentimeLogs: {
        create: [
            {
                logDate: '2026-04-26T00:00:00Z',
                totalMinutes: 99,
                topApp: 'VS Code',
            },
        ],
    },
};
type BuchCreated = Prisma.AppProfileGetPayload<{
    include: {
        trackingConfig: true;
        screentimeLogs: true;
    };
}>;

const geaendertesBuch: Prisma.AppProfileUpdateInput = {
    currentStreak: { increment: 1 },
    displayName: 'Beispiel - geaendert',
    statusMessage: 'geaendert',
};
type BuchUpdated = Prisma.AppProfileGetPayload<{}>; // eslint-disable-line @typescript-eslint/no-empty-object-type

// Schreib-Operationen mit dem Model "AppProfile"
try {
    await prisma.$connect();
    await prisma.$transaction(async (tx) => {
        // Neuer Datensatz mit generierter ID
        const buchDb: BuchCreated = await tx.appProfile.create({
            data: neuesBuch,
            include: { trackingConfig: true, screentimeLogs: true },
        });
        message = styleText(['black', 'bgWhite'], 'Generierte ID:');
        console.log(`${message} ${buchDb.id}`);
        console.log();

        const buchUpdated: BuchUpdated = await tx.appProfile.update({
            data: geaendertesBuch,
            where: { id: buchDb.id },
        });
        // eslint-disable-next-line require-atomic-updates
        message = styleText(['black', 'bgWhite'], 'Aktualisierter Streak:');
        console.log(`${message} ${buchUpdated.currentStreak}`);
        console.log();

        // https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions#referential-action-defaults
        // https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/relation-mode
        const geloescht = await tx.appProfile.delete({ where: { id: buchDb.id } });
        // eslint-disable-next-line require-atomic-updates
        message = styleText(['black', 'bgWhite'], 'Geloescht:');
        console.log(`${message} ${geloescht.id}`);
    });
} finally {
    await prisma.$disconnect();
}
