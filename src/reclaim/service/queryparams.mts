// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
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
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/**
 * Module for Typing in Get Method.
 * @packageDocumentation
 */

// Typdefinition für `find`
export type QueryParams = {
    readonly displayName?: string;
    readonly avatarUrl?: string;
    readonly statusMsg?: string;
    readonly timezone?: string;
    readonly currentStreak?: number;
    readonly onBoardingCompleted?: boolean;
    readonly erzeugt?: string;
    readonly aktualisiert?: string;
};

export const QueryParamKeys: Array<keyof QueryParams> = [
    'displayName',
    'avatarUrl',
    'statusMsg',
    'timezone',
    'currentStreak',
    'onBoardingCompleted',
    'erzeugt',
    'aktualisiert',
];
