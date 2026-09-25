import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
import { formatShortDate, getStatusColor, getStatusIcon, truncate } from "../utils/formatting.js";
export const ResourceTable = ({ resources, maxWidth = 100 }) => {
    if (resources.length === 0) {
        return (_jsx(Box, { paddingY: 1, children: _jsx(Text, { color: "gray", children: "No resources found" }) }));
    }
    const narrowMode = maxWidth < 80;
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", borderStyle: "single", borderColor: "gray", paddingX: 1, children: [_jsx(Box, { width: narrowMode ? 20 : 25, children: _jsx(Text, { bold: true, children: "Logical ID" }) }), !narrowMode && (_jsx(Box, { width: 20, children: _jsx(Text, { bold: true, children: "Physical ID" }) })), _jsx(Box, { width: 12, children: _jsx(Text, { bold: true, children: "Type" }) }), _jsx(Box, { width: 15, children: _jsx(Text, { bold: true, children: "Status" }) }), !narrowMode && (_jsx(Box, { width: 20, children: _jsx(Text, { bold: true, children: "Created" }) }))] }), resources.map((resource, index) => {
                const statusColor = getStatusColor(resource.status);
                const statusIcon = getStatusIcon(resource.status);
                const _isEven = index % 2 === 0;
                return (_jsxs(Box, { flexDirection: "row", paddingX: 1, children: [_jsx(Box, { width: narrowMode ? 20 : 25, children: _jsx(Text, { children: truncate(resource.name, narrowMode ? 18 : 23) }) }), !narrowMode && (_jsx(Box, { width: 20, children: _jsx(Text, { color: "gray", children: resource.stack && resource.stack !== "unknown"
                                    ? truncate(`${resource.stack}/${resource.name}`, 18)
                                    : truncate(resource.name, 18) }) })), _jsx(Box, { width: 12, children: _jsx(Text, { color: "cyan", children: resource.type }) }), _jsx(Box, { width: 15, children: _jsxs(Text, { color: statusColor, children: [statusIcon, " ", resource.status] }) }), !narrowMode && (_jsx(Box, { width: 20, children: _jsx(Text, { color: "gray", children: formatShortDate(resource.createdAt) }) }))] }, resource.name));
            })] }));
};
//# sourceMappingURL=ResourceTable.js.map