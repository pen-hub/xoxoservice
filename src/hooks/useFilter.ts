'use client'

import _, { get } from 'lodash';
import { useState } from 'react';


export type IParams = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    page?: string | number;
    sort?: string;
    limit?: string;
};

export type IPagination = {
    current: number;
    limit: number;
    total?: number;
};

const searchKey = 'search';

const useFilter =(initQuery: IParams = {}) => {
    const [query, setQuery] = useState<IParams>(initQuery);
    const [pagination, setPagination] = useState({ current: 1, limit: 10 });

    const reset = () => {
        setQuery(initQuery);
        setPagination({ current: 1, limit: 10 });
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateQuery = (key: string, value: any) => {
        const validateParams = _.omitBy({ ...query, [key]: value }, (value) =>
            value === undefined || value === '' || value === null || value === 'all' || (Array.isArray(value) && value.length === 0)
        );
       setQuery(validateParams)
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateQueries = (params: { key: string; value: any }[]) => {
        const newQuery = { ...query };

        // Remove keys that are in params but have empty values
        params.forEach(({ key, value }) => {
            // If value is explicitly null/undefined, remove the key
            if (value === undefined || value === null) {
                delete newQuery[key];
                return;
            }

            // If value is empty string or 'all', remove the key
            if (value === '' || value === 'all') {
                delete newQuery[key];
                return;
            }

            // If value is an empty array, remove the key
            if (Array.isArray(value) && value.length === 0) {
                delete newQuery[key];
                return;
            }

            // If value is an object (e.g., dateRange), check if it's empty
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                const obj = value as Record<string, any>;
                // Check if it's a dateRange object
                if ('from' in obj || 'to' in obj) {
                    const hasFrom = obj.from !== undefined && obj.from !== null && obj.from !== '';
                    const hasTo = obj.to !== undefined && obj.to !== null && obj.to !== '';
                    // If both from and to are empty, remove the key
                    if (!hasFrom && !hasTo) {
                        delete newQuery[key];
                        return;
                    }
                } else {
                    // For other objects, check if it has any non-empty properties
                    const hasValidProps = Object.values(obj).some(v =>
                        v !== undefined && v !== null && v !== '' &&
                        !(Array.isArray(v) && v.length === 0)
                    );
                    if (!hasValidProps) {
                        delete newQuery[key];
                        return;
                    }
                }
            }

            // Otherwise, set the value (including falsy but valid values like 0, false)
            newQuery[key] = value;
        });

        // Keep pagination and sort keys
        const preservedKeys = ['page', 'limit', 'sort'];
        preservedKeys.forEach(key => {
            if (query[key] !== undefined) {
                newQuery[key] = query[key];
            }
        });

        setQuery(newQuery);
    };

    const handlePageChange = (page: number, pageSize?: number) => {
        const newPageSize = pageSize || pagination.limit;
        setPagination({ current: page,  limit: newPageSize });
        updateQuery('page', page);
        updateQuery('limit', newPageSize);
    };

    const applyFilter = <T extends object>(data: T[]) => {
        if(!data) return [];
        return data.filter(item => {
            return Object.entries(query).every(([key, value]) => {
                if(key === 'page' || key === 'limit' || key === 'sort') return true;
                const isSearchKey = key.includes(searchKey);


                // Date handling:
                // - Range: value = { from?: string|Date|number, to?: string|Date|number }
                // - Exact date: value = string|Date|number -> match same calendar day
                const isRangeObj = (() => {
                    if (!value || typeof value !== 'object') return false;
                    const obj = value as Record<string, unknown>;
                    return 'from' in obj || 'to' in obj;
                })();
                const isDateLike = (v: unknown): boolean =>
                    v instanceof Date || (typeof v === 'number' && !isNaN(v as number)) || (typeof v === 'string' && !isNaN(Date.parse(v as string)));

                if (isRangeObj) {

                    const itemVal = get(item, key);

                    if (!itemVal) return true;
                    const itemDate = new Date(itemVal);
                    if (isNaN(itemDate.getTime())) return false;

                    const from = (value.from !== undefined && value.from !== null) ? new Date(value.from) : null;
                    const to = (value.to !== undefined && value.to !== null) ? new Date(value.to) : null;

                    if (from && isNaN(from.getTime())) return false;
                    if (to && isNaN(to.getTime())) return false;
                    if (from && to) {

                        return itemDate.getTime() >= from.getTime() && itemDate.getTime() <= to.getTime();
                    }
                    if (from) return itemDate.getTime() >= from.getTime();
                    if (to) return itemDate.getTime() <= to.getTime();

                    return true;
                }

                if (isDateLike(value)) {
                    const itemVal = get(item, key);
                    if (!itemVal) return false;
                    const itemDate = new Date(itemVal);
                    if (isNaN(itemDate.getTime())) return false;

                    const target = new Date(value as string | number | Date);
                    // match same calendar day (local)
                    const start = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0).getTime();
                    const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999).getTime();
                    return itemDate.getTime() >= start && itemDate.getTime() <= end;
                }

                // If filter value is an array -> treat as multiple acceptable tokens
                if (Array.isArray(value)) {

                    if (isSearchKey) {
                        const searchFields = key.split(',').slice(1);
                        return searchFields.some(field => {
                            const trimmedField = field.trim();
                            // Try direct property access first, then fallback to lodash get
                            const fieldValue = (item as any)[trimmedField] ?? get(item, trimmedField);
                            const fieldStr = fieldValue != null ? String(fieldValue) : '';
                            return value.some(v => {
                                const searchStr = v != null ? String(v).toLowerCase().trim() : '';
                                if (!searchStr) return true;
                                return fieldStr.toLowerCase().includes(searchStr);
                            });
                        });
                    }

                    const fieldVal = get(item, key);
                    // if the item's field is an array, check intersection with exact match
                    if (Array.isArray(fieldVal)) {
                        return value.some(v => fieldVal.includes(v));
                    }
                    // For select/radio filters with multiple values, use exact match
                    return value.some(v => {
                        const fieldStr = String(fieldVal ?? '').toLowerCase().trim();
                        const valueStr = String(v).toLowerCase().trim();
                        return fieldStr === valueStr;
                    });
                }

                if (isSearchKey) {
                    const searchFields = key.split(',').slice(1);
                    // Normalize search value: convert to string, trim, and handle empty
                    const searchValue = value != null ? String(value).trim() : '';
                    if (!searchValue) return true; // Empty search matches all
                    const normalizedSearch = searchValue.toLowerCase();

                    return searchFields.some(field => {
                        const trimmedField = field.trim();
                        // Try direct property access first, then fallback to lodash get
                        const fieldValue = (item as any)[trimmedField] ?? get(item, trimmedField);
                        // Convert to string - handle null, undefined, numbers, strings
                        if (fieldValue == null) return false;
                        const fieldStr = String(fieldValue).toLowerCase();
                        return fieldStr.includes(normalizedSearch);
                    });
                }

                // For non-search filters (select, radio, etc.), use exact match
                const itemValue = get(item, key);
                if (itemValue == null && value == null) return true;
                if (itemValue == null || value == null) return false;

                // Convert both to string for comparison (handles number/string mismatches)
                const itemStr = String(itemValue).toLowerCase().trim();
                const valueStr = String(value).toLowerCase().trim();

                // Use exact match for select/radio filters
                return itemStr === valueStr;
            });
        });
    };

    return { query, pagination, updateQuery, updateQueries, reset, applyFilter, handlePageChange };
};

export default useFilter;
