package com.colaborator.backend.controller;

import com.colaborator.backend.model.Order;
import com.colaborator.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") // Allow all origins for dev
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/community/{communityName}")
    public List<Order> getOrdersByCommunity(@PathVariable String communityName) {
        return orderService.getOrdersByCommunity(communityName);
    }

    @GetMapping("/aggregated")
    public Map<String, Map<String, Integer>> getAggregatedOrders() {
        return orderService.getAggregatedOrders();
    }
}
