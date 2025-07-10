
#!/bin/bash

echo "=== WATCHDOG STARTAD $(date) ===" >> logs/watchdog.log

# Sätt miljövariabler
export NODE_ENV=production
export PORT=5000
export REPLIT_DEPLOYMENT=1

# Definiera funktioner för processhantering
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> logs/watchdog.log
}

is_process_running() {
    local pid=$1
    if ps -p $pid > /dev/null; then
        return 0
    else
        return 1
    fi
}

restart_process() {
    local process_name=$1
    local log_file=$2
    local current_dir=$(dirname "$0")
    
    cd "$current_dir"
    
    if [[ "$process_name" == "index.js" ]]; then
        NODE_ENV=production nohup node index.js > $log_file 2>&1 &
    elif [[ "$process_name" == "aiQueryService.js" ]]; then
        export NODE_ENV=production
        export PORT=5000
        nohup node aiQueryService.js > $log_file 2>&1 &
    fi
    
    local pid=$!
    sleep 2
    if ps -p $pid > /dev/null; then
        echo $pid
    else
        return 1
    fi
}

check_and_restart_process() {
    local process_name=$1
    local log_file=$2
    local pid_file="logs/${process_name%.js}.pid"
    local max_restarts=3
    local restart_count=0

    if [ -f "$pid_file" ]; then
        local stored_pid=$(cat "$pid_file")
        
        if ! is_process_running $stored_pid; then
            log_message "Process $process_name (PID: $stored_pid) nere, försöker starta om..."
            
            while [ $restart_count -lt $max_restarts ]; do
                local new_pid=$(restart_process "$process_name" "$log_file")
                echo $new_pid > "$pid_file"
                
                # Vänta och kontrollera om processen överlevde
                sleep 5
                
                if is_process_running $new_pid; then
                    log_message "✅ $process_name startad om framgångsrikt (PID: $new_pid)"
                    return 0
                else
                    log_message "⚠️ Försök $((restart_count + 1))/$max_restarts misslyckades för $process_name"
                    restart_count=$((restart_count + 1))
                    sleep 2
                fi
            done
            
            log_message "❌ Kunde inte starta om $process_name efter $max_restarts försök"
            return 1
        else
            log_message "✅ $process_name (PID: $stored_pid) körs"
        fi
    else
        log_message "⚠️ Ingen PID-fil hittad för $process_name"
        local new_pid=$(restart_process "$process_name" "$log_file")
        echo $new_pid > "$pid_file"
        log_message "✅ Skapade ny process för $process_name (PID: $new_pid)"
    fi
}

# Huvudloop
while true; do
    log_message "🔄 Kontrollerar processer..."
    check_and_restart_process "index.js" "logs/server.log"
    check_and_restart_process "aiQueryService.js" "logs/ai.log"
    sleep 30
done
