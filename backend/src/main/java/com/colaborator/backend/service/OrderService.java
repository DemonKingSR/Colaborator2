package com.colaborator.backend.service;

import com.colaborator.backend.model.Order;
import com.colaborator.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public List<Order> getOrdersByCommunity(String communityName) {
        return orderRepository.findByCommunityName(communityName);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // Mathematical aggregation logic for Farmer Dashboard
    public Map<String, Map<String, Integer>> getAggregatedOrders() {
        List<Order> allOrders = orderRepository.findAll();
        
        // Group by Community
        Map<String, List<Order>> byCommunity = allOrders.stream()
                .collect(Collectors.groupingBy(Order::getCommunityName));

        // Aggregate quantities per crop inside each community
        return byCommunity.entrySet().stream()
                .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    e -> e.getValue().stream()
                            .collect(Collectors.groupingBy(
                                    Order::getCropName,
                                    Collectors.summingInt(Order::getQuantity)
                            ))
                ));
    }
}
