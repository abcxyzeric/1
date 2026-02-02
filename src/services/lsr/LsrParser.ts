
import { LSR_DATA } from "../../data/lsr_config";

export interface LsrTableDefinition {
    id: string;
    name: string;
    columns: string[];
}

export const LsrParser = {
    /**
     * Parses the static structure of LSR tables from the configuration.
     * Looks for patterns like "#0 TableName|0:Col1|1:Col2" inside the definition block.
     */
    parseDefinitions(): LsrTableDefinition[] {
        // The definitions are usually in Entry #6 or similar "Nhấn mạnh sau cùng" / "Structure" blocks
        // We will scan the provided LSR_DATA for these patterns.
        const contentToScan = LSR_DATA.entries["6"].content;
        
        const lines = contentToScan.split('\n');
        const tables: LsrTableDefinition[] = [];

        // Regex to match: #ID Name|0:Col|1:Col...
        // Example: #0 Thông tin Hiện tại|0:Thời gian|1:Địa điểm
        const tableDefRegex = /^#(\d+)\s+([^|]+)\|(.*)$/;

        lines.forEach(line => {
            const match = line.trim().match(tableDefRegex);
            if (match) {
                const id = match[1];
                const name = match[2].trim();
                const rawColumns = match[3];

                // Parse columns: "0:Name|1:Age" -> ["Name", "Age"]
                // Note: Some columns might have descriptions in parentheses which we might want to keep or clean
                const columns = rawColumns.split('|').map(col => {
                    // Extract text after the index (e.g., "0:Time" -> "Time")
                    const colParts = col.split(':');
                    return colParts.length > 1 ? colParts.slice(1).join(':').trim() : col.trim();
                });

                tables.push({ id, name, columns });
            }
        });

        return tables;
    },

    /**
     * Parses the runtime output from AI (Text-based LSR format).
     * Format:
     * <table_stored>
     * #0 Thông tin Hiện tại|0:Năm Thương Lan 3025|1:Hang đá
     * #1 Nhân vật Gần đây|0:Lộ Na|1:0|2:Ăn uống
     * </table_stored>
     * 
     * Returns a map of TableID -> Array of Rows (objects)
     */
    parseLsrString(rawString: string): Record<string, any[]> {
        const result: Record<string, any[]> = {};
        
        if (!rawString) return result;

        const lines = rawString.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            // Skip empty lines or lines not starting with #
            if (!line.startsWith('#')) return;

            // Regex: #Index Name|Data...
            // Match #(\d+) (Name)|(.*)
            // Example: #0 Thông tin Hiện tại|0:Val|1:Val
            const match = line.match(/^#(\d+)\s+([^|]+)\|(.*)$/);
            if (match) {
                const tableId = match[1];
                // const tableName = match[2].trim(); // Name is available but usually defined in definitions
                const rawData = match[3];

                const rowObj: Record<string, string> = {};
                
                // Split by pipe '|'. NOTE: Values might contain ':', need to handle index:value carefully.
                const cols = rawData.split('|');
                cols.forEach(col => {
                    // Format: Index:Value
                    // Use indexOf to split only on the first colon to allow colons in value
                    const firstColonIndex = col.indexOf(':');
                    if (firstColonIndex !== -1) {
                        const colIdx = col.substring(0, firstColonIndex).trim();
                        const colVal = col.substring(firstColonIndex + 1).trim();
                        rowObj[colIdx] = colVal;
                    }
                });

                if (!result[tableId]) {
                    result[tableId] = [];
                }
                result[tableId].push(rowObj);
            }
        });

        return result;
    }
};
