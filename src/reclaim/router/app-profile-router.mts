// Copyright (C) 2026 - present Juergen Zimmermann, Hochschule Karlsruhe
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
 * Das Modul besteht aus Router für die Verwaltung von Bücher.
 * @packageDocumentation
 */

import { Hono, HonoRequest } from 'hono';
import { container } from '../../container.mts';
import { getLogger } from '../../logger/logger.mts';
import { createPageable } from '../service/pageable.mts';
import { createPage } from './page.mts';

const { appProfileService } = container;

export const router = new Hono();

const logger = getLogger('buch-router', 'file');

// -----------------------------------------------------------------------------
// S u c h e   m i t   P f a d - P a r a m e t e r
// -----------------------------------------------------------------------------
router.get('/:id', async (c) => {
    const { req } = c;

    if (!checkAccept(req)) return c.body(null, 406);

    const id = req.param('id');
    logger.debug('get: id=%s', id);

    const appProfile = await appProfileService.findById({ id });

    // ETags
    // https://hono.dev/docs/api/request#header
    const ifNoneMatch = req.header('If-None-Match');
    const { version } = appProfile;
    if (ifNoneMatch === `"${version}"`) {
        logger.debug('get: Not Modified');
        // https://hono.dev/docs/api/context#body
        return c.body(null, 304);
    }

    logger.debug('get: version=%d', version);
    // https://hono.dev/docs/api/context#header
    const { header, json } = c;
    header('ETag', `"${version}"`);

    logger.debug('get: %o', appProfile);
    return json(appProfile);
});

// -----------------------------------------------------------------------------
// S u c h e   m i t   Q u e r y - P a r a m e t e r
// -----------------------------------------------------------------------------
router.get('/', async (c) => {
    const { req } = c;

    if (!checkAccept(req)) return c.body(null, 406);

    const queryParams = req.query();
    const countOnly = queryParams['count-only'];
    if (countOnly !== undefined) {
        const count = await appProfileService.count();
        logger.debug('get: count=%d', count);
        return c.json({ count });
    }

    const { page, size } = queryParams;
    delete queryParams['page'];
    delete queryParams['size'];
    logger.debug(
        'get: page=%s, size=%s,  queryParams=%o',
        page,
        size,
        queryParams,
    );

    const pageable = createPageable({ number: page, size });
    const appProfileSlice = await appProfileService.find(queryParams, pageable); // NOSONAR
    const appProfilePage = createPage(appProfileSlice, pageable);
    logger.debug('get: appProfilePage=%o', appProfilePage);
    return c.json(appProfilePage);
});

// -----------------------------------------------------------------------------
// D o w n l o a d
// -----------------------------------------------------------------------------
router.get('/file/:id', async (c) => {
    const id = c.req.param('id');
    logger.debug('download: id=%s', id);
    const idNumber = Number.parseInt(id, 10);
    if (Number.isNaN(idNumber)) {
        return c.notFound();
    }

    const buchFile = await appProfileService.findFileByBuchId(idNumber);
    if (buchFile === undefined) {
        return c.notFound();
    }

    return c.body(buchFile.data, {
        headers: { 'Content-Type': buchFile.mimetype ?? '' },
    });
});

/**
 * Check Accept Header of request
 * @param req request object
 * @param onNotAccept Function to execute when check fails.
 * @returns void
 */
const checkAccept = (req: HonoRequest): boolean => {
    const accept = req.header('Accept')?.toLowerCase() ?? '*/*';
    if (accept !== '*/*' && !/(json|html)/u.test(accept)) {
        logger.debug('get: Accept=%s', accept);

        // Not Acceptable
        return false;
    }
    return true;
};
